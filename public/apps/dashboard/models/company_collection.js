define(
    [
        'jquery',
        'underscore',
        'backbone',
        'models/company'
    ],
    function($, _, Backbone, CompanyModel){
        return Backbone.Collection.extend({
            model : CompanyModel,
            initialize : function(models, options) {
            },
            unselectAll : function() {
                this.each(function(company){
                    company.set("selected",false);
                });
            }
        });
    }
);
