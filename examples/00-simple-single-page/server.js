'use strict';

var express = require('express'),
    fluxexapp = require('./fluxexapp'),
    serverAction = require('./actions/server'),
    fluxexServerExtra = require('fluxex/extra/server'),
    app = express();

// Provide /static/js/main.js
fluxexServerExtra.initStatic(app);

// Mount test page at /test
app.use('/test', fluxexServerExtra.middleware(fluxexapp, serverAction.samplePageWithQuery));

// Start server
app.listen(3000);
console.log('Fluxex started on port 3000');