define(
    [
        'jquery',
        'underscore',
        'backbone',
        'views/dashboard',
        'models/company_collection'
    ],
    function($, _, Backbone, Dashboard, CompanyCollection){
        var companyCollection = new CompanyCollection();

        var router = Backbone.Router.extend({
            routes:{
                "" : "index",
                "company/:duns" : "company"
            },
            index:function () {
                var dashboard = new Dashboard({
                    companyCollection : companyCollection
                });
                $('body').append(dashboard.render().el)
            },
            company: function(duns) {
                
            }

        });

        return router;
    }
);
