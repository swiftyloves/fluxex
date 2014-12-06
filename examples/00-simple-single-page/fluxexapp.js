'use strict';

module.exports = require('fluxex').createApp({
    sampleStore: require('./stores/sample'),
    page: require('./stores/page'),
    productStore: require('./stores/product')
}, process.cwd() + '/components/Html.jsx');