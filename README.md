FluxEx
======

An extended Flux implementation to build isomorphic javascript React app.

[![npm version](https://img.shields.io/npm/v/fluxex.svg)](https://www.npmjs.org/package/fluxex) [![npm download](https://img.shields.io/npm/dm/fluxex.svg)](https://www.npmjs.org/package/fluxex) [![Dependency Status](https://david-dm.org/zordius/fluxex.svg)](https://david-dm.org/zordius/fluxex) [![devDependency Status](https://david-dm.org/zordius/fluxex/dev-status.svg)](https://david-dm.org/zordius/fluxex#info=devDependencies) [![Build Status](https://travis-ci.org/zordius/fluxex.svg?branch=master)](https://travis-ci.org/zordius/fluxex) [![Test Coverage](https://codeclimate.com/github/zordius/fluxex/badges/coverage.svg)](https://codeclimate.com/github/zordius/fluxex) [![Code Climate](https://codeclimate.com/github/zordius/fluxex/badges/gpa.svg)](https://codeclimate.com/github/zordius/fluxex) [![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE.txt)

[![npm](https://nodei.co/npm/fluxex.png?downloads=true)](https://www.npmjs.org/package/fluxex)

<img src="https://github.com/zordius/fluxex/raw/last_result/examples/00hello/badge.png" />

Features
--------

**All in one Starter**

<a href="https://github.com/zordius/fluxex/blob/master/extra/gulpfile.js"><img src="https://github.com/zordius/fluxex/raw/master/gulp_starter.jpg" /></a>

**Everything in React**

<a href="https://github.com/zordius/fluxex/blob/master/examples/04-infinite-scroll/components/Html.jsx"><img src="https://github.com/zordius/fluxex/raw/master/start_from_html.jpg" /></a>

**Minimal context APIs**

To understand Flux, you only need to learn these APIs: `this.executeAction()`, `this.getStore()`, `this.dispatch()` !

* `this.executeAction()` or `this.getStore(name)` in components.
* `this.dispatch()` or `this.executeAction()` or `this.getStore(name)` in actions.
* `this.emitChange()` or `this._get()` or `this._set()` in stores.

<img src="https://github.com/zordius/fluxex/raw/master/fluxex-api.jpg" />
<hr/>

* [CORE] Super lightweight, less than 250 lines of code.
* [CORE] Context based flux system.
* [CORE] React Server side rendering + client mount.
* [CORE] HTML as top level react component, no need container.
* [EXTRA] express middleware to serve the fluxex application.
* [EXTRA] full integrated gulp task for development.
* [EXTRA] pjax support.
* [EXTRA] request and wrapped request service support.

See the FluxEx Magic
--------------------

* Check <a href="https://github.com/zordius/fluxex/tree/master/examples">example projects</a> you can see how fluxex do server side rendering + context deliver + Full HTML react rendering!
* No more index.html. Start with <a href="https://github.com/strongloop/express">npm:express</a> and your Html.jsx!
* No more AJAX, all http request by <a href="https://github.com/request/request">npm:request</a>!

Start from Scratch
------------------

Read <a href="https://github.com/zordius/fluxex/blob/master/SCRATCH.md">Start from Scratch</a> to know how to create a fluxex application!

Quick Start
-----------

**Prepare your project**
```sh
npm init
npm install fluxex
```

**Use the Starter template**
```sh
node_modules/.bin/fluxex_starter
```

**Start the Server**
```sh
node_modules/.bin/gulp develop
```

* Connect to http://localhost:3001/search?q=pizza
* You can start your development now, gulp handled everything (jshint, browserify, nodemon, restart, browser-sync).
* Put your actions, stores and components into correspond directories.
* Edit components/Html.jsx to include your React components.
* Edit actions/routing.js to add routing.
* Edit fluxexapp.js to add your store.

Difference with Flux
--------------------

FluxEx is context based flux implemention. Server side react rendering can be done easy when the flux is scoped under a request based context. Store and dispatcher are singletons in <a href="https://github.com/facebook/flux">Facebook flux</a>, but in fluxex they are not.

<hr/>
**Fluxex**
* Fluxex is an instance, it is constructed by provided context.
* Fluxex can be serialized by `.toString()` and reconstructed by the serialized string. All server side store status can be transfered to client side by this way.
* use the static `.createApp()` to create a Fluxex application.

```javascript
var myApp = require('fluxex').createApp({
    product: require('./stores/product')
}, process.cwd() + '/components/Html.jsx');
```

<hr/>
**Action**
* An action creator should return a promise.
* An action creator function can be executed by `.executeAction()`.
* When the action be `.executeAction()`, the Fluxex instance can be referenced by `this`.
* `.executeAction()` will return a promise, so you can manage asynchronous actions in promise way.

```javascript
// inside a component, requires Fluxex.mixin
...
onStoreChange: function () {
    return this.getStore('myStore').getSomething();
},
handleClick: function () {
    this.executeAction(myAction);
}
```

<hr/>
**Dispatcher**
* the Fluxex instance itself is a dispatcher with `.dispatch()` method.
* the dispatched `FOOBAR` action will trigger all `handle_FOOBAR` method of all stores. When there is no `handle_FOOBAR` method in any store, an error will be throw.

```javascript
// myAction
var myAction = function (payload) {
    ... do your tasks ....
    return this.dispatch('UPDATE_SOMETHING', ....); // this returns a promise
}
```

<hr/>
**Store**
* Store is an instance, it is constructed by serialized status.
* Store is created by a Fluxex.
* Use `.getStore(name)` to get the store by name.
* You can `._get()` and `._set()` by property name. Ex: `this._set('data', 123)`
* Everything you `._set()` can be serialized by `.toString()` and be tracked by your Fluxex application.
* You can use `waitFor` property to refine dispatch depdency for specific action.

```javascript
var myStore = {
    // the dispatch will happened after these stores be dispatched
    waitFor: {
        UPDATE_SOMETHING: ['oneStore', 'anotherStore']
    },

    // handle this.dispatch('UPDATE_SOMETHING', ....)
    handle_UPDATE_SOMETHING: function (payload) {
        this._set('data', payload); // There are ._get() and ._set() in all stores
        this.emitChange();
    }
}
```

Notes for IE8 support
---------------------

* You should add `require('fluxex/extra/polyfill-ie8');` in your `fluxexapp.js` to polyfill EventListener methods and XMLHttpRequest consts for IE8.
* `catch` is reserved keyword in IE8, you need to replace `somePromise.catch(...)` with `somePromise['catch'](...)`
* `for (... in ...)` will loop beyond properties in IE8, you need to replace `for (I in myArray)` with `myArray.forEach(function (V, I) { ...}`

**IE8 Unsupported features**

* window.history.pushState
* set innerHTML of script or title node
* compare prototype.constructor with another function
* console and console.log when developer tool not opened
