requirejs.config({
    paths: {
        // third party
        "jquery": "../../lib/jquery/jquery-2-0-3.min",
        "bootstrap": "../../lib/bootstrap/bootstrap",
        "underscore": "../../lib/backbone/underscore-min",
        "backbone": "../../lib/backbone/backbone-min",
        "text_loader": "../../lib/requirejs/text",
        "typeahead" : "../../lib/typeahead/typeahead.min",
        "select2" : "../../lib/select2/select2.min",
        "async": "../../lib/async/async",
        "humanize": "../../lib/humanize/humanize",
        "moment" : "../../lib/moment/moment.min",
        "humanize" : "../../lib/humanize/humanize",
        "requirejs-async" : "../../lib/requirejs/async",
    },
    shim: {
        "backbone": {
            deps: ["underscore", "jquery"], // Load these dependencies first
            exports: "Backbone" // Create global var with this name for the module
        },
        "underscore": {
            exports: "_"
        },
        "bootstrap" : {
            deps : ["jquery"]
        },
        "typeahead" : {
            deps : ["jquery"]
        }
    }
});

require.config({
    urlArgs: "bust=" + (new Date()).getTime()
});

// Startup
require(
    [
        "jquery",
        "underscore",
        "backbone",
        "app"
    ],
    function($, _, Backbone, App) {
        App.initialize();
    }
);