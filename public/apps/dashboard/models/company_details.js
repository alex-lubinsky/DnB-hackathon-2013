define(
    [
        'jquery',
        'underscore',
        'backbone'
    ],
    function($, _, Backbone){
        return Backbone.Model.extend({
            initialize : function(attributes,options){
            },
            url : function(){
                return "api/mainlookup?duns=" + this.get("id");
            },
            getQuery : function() {
                return this.get("name") + ", " + this.getCityState();
            },
            getCityState : function() {
                return this.get("address.city") + ", " + this.get("address.state");
            },
            getAddress : function() {
                return _.filter([
                        this.get("address.street"),
                        this.get("address.city"),
                        this.get("address.state"),
                        this.get("address.zip")
                    ], function(e){return e}).join(", ");
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
