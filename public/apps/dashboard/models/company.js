define(
    [
        'jquery',
        'underscore',
        'backbone',
        'models/company_details'
    ],
    function($, _, Backbone, CompanyDetails){
        return Backbone.Model.extend({
            initialize : function(attributes,options){
                this.set("details", new CompanyDetails({
                    id : this.get("id")
                }));
            },
            get : function(name) {
                if (name.indexOf(".") != -1) {
                    // Trick for getting nested values
                    // result.get("item")["title"]
                    // becomes
                    // result.get("item.title")
                    // this is particularly useful for backgrid.js
                    var parts = name.split(".");
                    var val = this.get(parts[0]);
                    for (var i = 1; i < parts.length ; i ++){
                        if (val != undefined && parts[i] in val) {
                            val = val[parts[i]];
                        } else {
                            return "";
                        }
                    }
                    return val;
                }
                return Backbone.Model.prototype.get.apply(this, arguments); 
            }
        });
    }
);
