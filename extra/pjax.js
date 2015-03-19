'use strict';

// Use this mixin at HTML/BODY level to enable pjax behavior
// Your fluxexapp should provide routeToURL() for this mixin
// See routeToURL.js for more info
//
// To support IE8,
// You will need to npm install html5-history-api,
// then add require('fluxex/extra/history'); in your fluxexapp.js

module.exports = {
    componentDidMount: function () {
        /*global window,document*/
        var blockDoublePop = (document.readyState != 'complete'),
            initState = this._getContext()._context,
            location = window.history.location || window.location,
            initUrl = location.href;

        window.addEventListener('load', function() {
            setTimeout(function () {
                blockDoublePop = false;
            }, 1);
        });

        window.addEventListener('popstate', function (E) {
            var state = E.state || ((location.href === initUrl) ? initState : undefined);

            if (blockDoublePop && (document.readyState === 'complete')) {
                return;
            }

            if (!state) {
                // NO STATE DATA....can not re-render, so reload.
                location.reload();
                return;
            }

            // Ya, trigger page restore by an anonymous action
            this.executeAction(function () {
                this._restore(state);
                this.dispatch('**UPDATEALL**');
                return Promise.resolve(true);
            }.bind(this._getContext()));
        }.bind(this));
    },

    handleClickLink: function (E) {
        var HREF = E.target.href;

        if (!HREF || HREF.match(/#/)) {
            return;
        }

        E.preventDefault();
        E.stopPropagation();

        this._getContext().routeToURL(HREF);
    }
};
