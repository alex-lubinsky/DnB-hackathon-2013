define(
    [
        'jquery',
        'underscore',
        'backbone',
        'models/company',
        'text_loader!templates/new_investigation/new_investigation.ejs.html',
        'text_loader!templates/new_investigation/typeahead_template.ejs.html',
        'typeahead',
        'select2'
    ],
    function($, _, Backbone, CompanyModel, NewInvestigationTemplate, TypeaheadTemplate, undefined, undefined){
        return Backbone.View.extend({
            tagName: "span",

            initialize : function(options) {
                this.companyCollection = options.companyCollection;
            },

            events : {
            },

            setupSearch : function(){
                var $inputField = this.$el.find('form.new-investigation-form input[name="query"]'),
                    that        = this;

                $inputField.typeahead({
                    name: 'companies',
                    template : TypeaheadTemplate,
                    engine : {
                        compile : function(template){
                            var compiled = _.template(template);
                            return {
                                render : function(context){
                                    return compiled(context);
                                }
                            };
                        }
                    },
                    remote : {
                        url : '/api/textsearch?text=%QUERY',
                        filter : function(data) {
                            return _.map(data.companies,formatResult);
                        },
                        beforeSend : function($xhr) {
                            that.$el.find('.loading').removeClass('hide');
                            $xhr.always(function(){
                                that.$el.find('.loading').addClass('hide');
                            });
                        }
                    }
                });

                $inputField.on("typeahead:selected",function(event,result){
                    event.preventDefault();
                    that.$el.find('.result-content').html("Selected: "  +result.value);

                    var company = that.companyCollection.findWhere({id:result.id}) || new CompanyModel(result);
                    company.set("selected", true);
                    that.companyCollection.add(company);
                    that.companyCollection.trigger("selected", company);
                    return false;
                });

                function formatResult(result){
                    var formattedResult = {
                        value: "N/A",
                        id : result.DUNSNumber,
                        source: result
                    };
                    if (result.OrganizationPrimaryName &&
                        result.OrganizationPrimaryName.OrganizationName &&
                        result.OrganizationPrimaryName.OrganizationName.$) {
                        formattedResult.value = result.OrganizationPrimaryName.OrganizationName.$;
                    } else {
                        formattedResult.value = result.DUNSNumber;
                    }
                    formattedResult.name = formattedResult.value;
                    var addressParts = [];
                    if (result.PrimaryAddress &&
                        result.PrimaryAddress.PrimaryTownName) {
                        addressParts.push(result.PrimaryAddress.PrimaryTownName);
                    }
                    if (result.PrimaryAddress &&
                        result.PrimaryAddress.TerritoryAbbreviatedName) {
                        addressParts.push(result.PrimaryAddress.TerritoryAbbreviatedName);
                    }
                    if (result.PrimaryAddress &&
                        result.PrimaryAddress.CountryISOAlpha2Code) {
                        addressParts.push(result.PrimaryAddress.CountryISOAlpha2Code);
                    }
                    formattedResult.address = addressParts.join(", ");
                    return formattedResult;
                }
            },

            template : function() {
                return _.template(NewInvestigationTemplate)();
            },

            render:function (eventName) {
                this.$el.html(this.template());
                this.setupSearch();
                this.delegateEvents();
                return this;
            }
        });
    }
);
