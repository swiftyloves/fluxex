'use strict';

var React = require('react'),
    Fluxex = require('fluxex'),

Html = React.createClass({
    mixins: [
        Fluxex.mixin,
        require('fluxex/extra/storechange'),
        {listenStores: ['product']}
    ],

    getStateFromStores: function () {
        return this.getStore('product').getData();
    },

    handleClick: function () {
        var product = this.state;
        product.sold++;
        this.executeAction(function () {
            return this.dispatch('UPDATE_PRODUCT', product);
        });
    },

    render: function () {
        return (
        <html>
         <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, user-scalable=no" />
          <title>Hello!</title>
         </head>
         <body onClick={this.handleClick}>
          <h1>Hello!!</h1>
          <ul>
           <li>Product: {this.state.title}</li>
           <li>Price: {this.state.price}</li>
           <li>Sold: {this.state.sold}</li>
          </ul>
         <script src="/static/js/main.js"></script>
         <script dangerouslySetInnerHTML={{__html: this.getInitScript()}}></script>
         </body>
        </html>
        );
    }
});

module.exports = Html;
