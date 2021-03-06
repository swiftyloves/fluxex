'use strict';

// Init ES6 + jsx environments for .require()
require('babel/register')({
    extensions: ['.jsx']
});

var express = require('express'),
    fluxexapp = require('./fluxexapp'),
    fluxexServerExtra = require('fluxex/extra/server'),
    app = express();

// Provide /static/js/main.js
fluxexServerExtra.initStatic(app);

// Setup fetch services
fluxexServerExtra.setupRPC(app, {
    yql: 'https://query.yahooapis.com/v1/public/yql'
});

// Mount fluxexapp, it will handle routing itself
app.use(fluxexServerExtra.createMiddlewareWithRouting(fluxexapp));

// Start server
app.listen(process.env.TESTPORT || 3000);
console.log('Fluxex started! Go http://localhost:3001/search?q=apple');
