var gulp = require('gulp'),
    gutil = require('gulp-util'),
    jscs = require('gulp-jscs'),
    jshint = require('gulp-jshint'),
    cached = require('gulp-cached'),
    coverage = require('gulp-jsx-coverage'),
    fs = require('fs'),
    React = require('react-tools'),
    through = require('through2'),
    buffer = require('vinyl-buffer'),
    source = require('vinyl-source-stream'),
    aliasify = require('aliasify'),
    babelify = require('babelify'),
    browserify = require('browserify'),
    babel = require('gulp-babel'),
    uglify = require('gulp-uglify'),
    nodemon = require('nodemon'),
    browserSync = require('browser-sync'),
    serverStarted = false,

// If you use vim and watch tasks be triggered 2 times when saving
// You can :set nowritebackup in vim to prevent this
// Reference: https://github.com/joyent/node/issues/3172
configs = {
    lint_files: {
        js: ['actions/*.js', 'stores/*.js'],
        jsx: ['components/*.jsx']
    },

    static_dir: 'static/',
    mainjs: require(process.cwd() + '/package.json').main,
    appjs: process.cwd() + '/fluxexapp.js',
    nodemon_restart_delay: 200,
    nodemon_delay: 2000,
    gulp_watch: {debounceDelay: 500},
    watchify: {debug: true, delay: 500},
    jshint_jsx: {quotmark: false},
    jshint_fail: false,
    jscs_fail: false,
    aliasify: {
        aliases: {
            request: 'browser-request'
        }
    },
    babelify: {
        optional: ['runtime'],
        ignore: /node_modules/,
        extensions: ['.js', '.jsx']
    },
    test_coverage: {
        default: {
            src: ['test/**/*.js', 'test/components/*.jsx', 'test/components/*.js'],
            istanbul: {
                coverageVariable: '__FLUXEX_COVERAGE__',
                exclude: /node_modules\/|test\//
            },
            coverage: {
                directory: 'coverage'
            },
            mocha: {},
            react: {
                sourceMap: true
            },
            coffee: {
                sourceMap: true
            }
        },
        console: {
            coverage: {
                reporters: ['text-summary']
            },
            mocha: {
                reporter: 'spec'
            }
        },
        report: {
            coverage: {
                reporters: ['lcov', 'json']
            },
            mocha: {
                reporter: 'mocha-jenkins-reporter'
            }
        }
    }
},

restart_nodemon = function () {
    setTimeout(function () {
        nodemon.emit('restart');
    }, configs.nodemon_restart_delay);
},

lint_chain = function (task) {
    task = task.pipe(jshint.reporter('jshint-stylish'));

    if (configs.github) {
        task = task.pipe(require('gulp-github')(configs.github));
    }

    if (configs.jshint_fail) {
        task = task.pipe(('object' === typeof configs.jshint_fail) ? configs.jshint_fail : jshint.reporter('fail'));
    }

    return task;
},

// Do testing tasks
get_testing_task = function (options) {
    var cfg = JSON.parse(JSON.stringify(configs.test_coverage.default));

    cfg.istanbul.exclude = configs.test_coverage.default.istanbul.exclude;
    cfg.coverage.reporters = options.coverage.reporters;
    cfg.mocha = options.mocha;
    cfg.cleanup = configs.test_coverage.default.cleanup;

    return coverage.createTask(cfg);
},

handleJSCSError = function (E) {
    if (!configs.jscs_fail) {
        return;
    }

    if ('function' === typeof configs.jscs_fail) {
        return configs.jscs_fail(E);
    }

    this.emit('error', E);
},

bundleAll = function (b, noSave) {
    var B = b.bundle()
    .on('error', function (E) {
        gutil.log('[browserify ERROR]', gutil.colors.red(E));
    });

    if (!noSave) {
        B.pipe(source('main.js'))
        .pipe(gulp.dest(configs.static_dir + 'js/'))
        .on('end', restart_nodemon);
    }

    return B;
},

buildApp = function (watch, fullpath, nosave, disc) {
    var b = browserify(configs.appjs, {
        cache: {},
        packageCache: {},
        require: (disc ? process.cwd() : '.') + '/components/Html.jsx',
        standalone: 'Fluxex',
        fullPaths: fullpath ? true: false,
        debug: watch
    });

    b.transform(babelify.configure(configs.babelify), {global: true});
    b.transform(aliasify.configure(configs.aliasify), {global: true});

    if (watch) {
        b = require('watchify')(b, configs.watchify);
        b.on('update', function (F) {
            gutil.log('[browserify] ' + F[0] + ' updated');
            bundleAll(b);
        });
    }

    return bundleAll(b, nosave);
};


gulp.task('build_app', function () {
    return buildApp(false, false, true)
        .pipe(source('main.js'))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(gulp.dest(configs.static_dir + 'js/'));
});

gulp.task('disc_app', function () {
    return buildApp(false, true, true, true)
        .pipe(require('disc')())
        .pipe(fs.createWriteStream(configs.static_dir + 'disc.html'));
});

gulp.task('watch_app', function () {
    return buildApp(true, true);
});

gulp.task('watch_flux_js', ['lint_flux_js'], function () {
    gulp.watch(configs.lint_files.js, configs.gulp_watch, ['lint_flux_js']);
});

gulp.task('lint_flux_js', function () {
    return lint_chain(
        gulp.src(configs.lint_files.js)
        .pipe(cached('jshint'))
        .pipe(jscs()).on('error', handleJSCSError)
        .pipe(jshint())
    );
});

gulp.task('watch_jsx', ['lint_jsx'], function () {
    gulp.watch(configs.lint_files.jsx, configs.gulp_watch, ['lint_jsx']);
});

gulp.task('lint_jsx', function () {
    return lint_chain(
        gulp.src(configs.lint_files.jsx)
        .pipe(cached('jshint'))
        .pipe(babel({sourceMap: true}))
        .pipe(jscs()).on('error', handleJSCSError)
        .pipe(jshint(configs.jshint_jsx))
    );
});

gulp.task('watch_server', ['lint_server'], function () {
    gulp.watch(configs.mainjs, configs.gulp_watch, ['lint_server'])
    .on('change', function () {
        nodemon.emit('restart');
    });
});

gulp.task('lint_server', function () {
    return gulp.src(configs.mainjs)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('nodemon_server', ['watch_flux_js', 'watch_jsx', 'watch_app', 'watch_server'], function () {
    nodemon({
        ignore: '*',
        script: configs.mainjs,
        ext: 'do_not_watch'
    })
    .on('log', function (log) {
        gutil.log(log.colour);
    })
    .on('start', function () {
        if (serverStarted) {
            setTimeout(browserSync.reload, configs.nodemon_delay);
        } else {
            browserSync.init(null, {
                proxy: 'http://localhost:3000',
                files: [configs.static_dir + 'css/*.css'],
                port: 3001,
                online: false,
                open: false
            });

            serverStarted = true;
        }
    });
});

gulp.task('watch_tests', ['test_app'], function () {
    gulp.watch([
        configs.test_coverage.default.src,
        configs.lint_files.js,
        configs.lint_files.jsx
    ], ['test_app']);
});
gulp.task('test_app', function (cb) {
    get_testing_task(configs.test_coverage.console)(cb).on('error', function (E) {
        if (E.stack || E.showStack) {
            console.warn(E.stack);
        } else {
            console.warn(E);
        }
    }).on('end', function () {
        cb(); // prevent failed ending
    });
});
gulp.task('save_test_app', function () {
    return get_testing_task(configs.test_coverage.report)();
});
gulp.task('develop', ['nodemon_server']);
gulp.task('lint_all', ['lint_server', 'lint_flux_js', 'lint_jsx']);
gulp.task('buildall', ['lint_all', 'build_app']);
gulp.task('default',['buildall']);

module.exports = configs;
