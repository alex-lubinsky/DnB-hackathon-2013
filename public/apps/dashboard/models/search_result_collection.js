define(
    [
        'jquery',
        'underscore',
        'backbone',
        'models/search_result'
    ],
    function($, _, Backbone, SearchResultModel){
        return Backbone.Collection.extend({
            url : "https://ajax.googleapis.com/ajax/services/search/web",
            model : SearchResultModel,
            initialize : function(models, options) {
            }
        });
    }
);
