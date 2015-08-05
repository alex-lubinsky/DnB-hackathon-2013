define(
    [
        'jquery',
        'underscore',
        'backbone',
        'models/search_result_collection',
        'models/company',
        'text_loader!templates/company/company.ejs.html',
        'text_loader!templates/company/details.ejs.html',
        'text_loader!templates/company/additional.ejs.html',
        'text_loader!templates/company/additional_companies.ejs.html',
        'text_loader!templates/company/additional_risk.ejs.html',
        'text_loader!templates/company/search_tabs.ejs.html',
        'text_loader!templates/company/search_results.ejs.html',
        'async',
        'requirejs-async!http://maps.google.com/maps/api/js?sensor=false',
        'backbone'
    ],
    function($, _, Backbone,
            SearchResultCollection, CompanyModel,
            CompanyTemplate, DetailsTemplate, AdditionalTemplate,
            AdditionalCompaniesTemplate, AdditionalRiskTemplate,
            SearchTabsTemplate, SearchResultsTemplate,
            Async,
            undefined, undefined){
        return Backbone.View.extend({
            tagName: "span",
            className : 'company-content',

            initialize : function(options) {
                this.companyCollection = options.companyCollection;
                this.company = options.company;
            },

            events : {
                "click .search-results a[data-toggle=\"tab\"]"  : "clickSearchResultsTab",
                "click .additional .company-link"               : "clickSelectCompanyLink"
            },

            clickSearchResultsTab : function(event) {
                event.preventDefault();
                var $link       = $(event.currentTarget),
                    $links      = this.$el.find(".search-results a[data-toggle=\"tab\"]"),
                    query       = $link.data("query"),
                    searchType  = $link.data("search-type");
                // Select tab
                $links.parent("li").removeClass("active");
                $link.parent("li").addClass("active");

                this.renderSearchResults(searchType, query);
                return false;
            },

            clickSelectCompanyLink : function(event) { 
                event.preventDefault();
                var $link = $(event.currentTarget),
                    id = $link.data("id")+"",
                    name = $link.data("name");

                var existingCompany = this.companyCollection.findWhere({id:id});
                if (existingCompany) {
                    this.companyCollection.trigger("selected", existingCompany);
                } else {
                    var company = new CompanyModel({
                        id : id,
                        name : name
                    });
                    this.companyCollection.add(company);
                    this.companyCollection.trigger("selected", company);
                }
                window.scrollTo(0);
            },

            renderDetailsError : function(message) {
                this.$el.find(".company-details").html(message);
            },

            renderDetails : function() {
                this.$el.find(".company-details").html(this.templateDetails());
                this.renderMap(".map-basic", ".map-streetview", google.maps.MapTypeId.HYBRID, 16);
                this.renderSearchResultsTabs();

                this.renderExtras();
            },

            renderExtras: function() {
                var that = this,
                    extrasRenderers = _.map([this.renderRevenueNumber,
                                   this.renderPhoneLookup,
                                   this.renderAddressLookup,
                                   this.renderRiskLookup,
                                   this.renderFraudReport,
                                   this.renderViabilityLookup,
                                   this.renderPrincipalSearch
                                  ], function(f){
                        return _.bind(f,that);
                    });
                this.$el.find(".additional").html(this.templateAdditional());
                Async.series(extrasRenderers);
            },

            renderRevenueNumber : function(callback) {

                var duns = this.$el.find(".company-details").data('duns');
                var numEmployeesStr = this.$el.find('.num-employees').text();
                var $revenue = this.$el.find('.additional-analysis-revenue');

                var numEmployees = numEmployeesStr && parseInt(numEmployeesStr,10);

                $revenue.text('Loading...');

                $.ajax({
                    url: '/api/revenuelookup',
                    type: 'GET',
                    data: {duns: duns}
                }).done(function(response) {
                    var revenueText = response.text;
                    var revenueAmount = response.amount;
                    var revenueCurrency = response.currency;

                    if (revenueText && revenueAmount && numEmployees && !isNaN(numEmployees) && isFinite(numEmployees) && revenueCurrency === 'USD' && numEmployees < 100) {
                        revenueText += ' ($'+Math.round(revenueAmount/numEmployees)+' per employee)';
                    }

                    revenueText = revenueText || 'Unknown';

                    $revenue.text(revenueText);
                }).fail(function() {
                    $revenue.text('Error');
                }).always(function() {
                    if (callback) {
                        callback();
                    }
                });
            },

            renderPhoneLookup : function(callback) {

                var phone = this.$el.find('.phone').text();
                var $phone = this.$el.find('.additional-analysis-phone');

                $phone.text('Loading...');

                $.ajax({
                    url: '/api/phonesearch',
                    type: 'GET',
                    data: {phone: phone}
                }).done(function(response) {
                    var companies = response.companies;

                    $phone.html(_.template(AdditionalCompaniesTemplate)({
                        companies : companies
                    }));

                }).fail(function() {
                    $phone.text('Error');
                }).always(function() {
                    if (callback) {
                        callback();
                    }
                });
            },

            renderAddressLookup : function(callback) {

                var $address = this.$el.find('.additional-analysis-address');
                var street = this.$el.find('.address-street').text();
                var city = this.$el.find('.address-city').text();
                var state = this.$el.find('.address-state').text();
                var zip = this.$el.find('.address-zip').text();

                $address.text('Loading...');

                $.ajax({
                    url: '/api/addresssearch',
                    type: 'GET',
                    data: {street: street, city: city, state: state, zip: zip}
                }).done(function(response) {
                    var companies = response.companies;

                    $address.html(_.template(AdditionalCompaniesTemplate)({
                        companies : companies
                    }));

                }).fail(function() {
                    $address.text('Error');
                }).always(function() {
                    if (callback) {
                        callback();
                    }
                });
            },

            renderPrincipalSearch : function(callback) {

                var $principal = this.$el.find('.additional-analysis-principal');
                var name = this.$el.find('.principal-employee').text();

                $principal.text('Loading...');

                $.ajax({
                    url: '/api/principalsearch',
                    type: 'GET',
                    data: {name: name}
                }).done(function(response) {
                        var companies = response.companies;

                        $principal.html(_.template(AdditionalCompaniesTemplate)({
                            companies : companies
                        }));

                    }).fail(function() {
                        $principal.text('Error');
                    }).always(function() {
                        if (callback) {
                            callback();
                        }
                    });
            },


            renderRiskLookup: function(callback) {
                var duns = this.$el.find(".company-details").data('duns');
                var $risk = this.$el.find('.additional-analysis-risk');

                $risk.text('Loading...');

                $.ajax({
                    url: '/api/risklookup',
                    type: 'GET',
                    data: {duns: duns}
                }).done(function(response) {
                    var score = response.commercialCreditScore || 'Unknown';
                    var assessment = response.riskAssessment || 'Unknown';
                    var summary = response.assementSummary || 'No summary';

                    $risk.html(_.template(AdditionalRiskTemplate)({
                        score : score,
                        assessment : assessment,
                        summary : summary
                    }));

                }).fail(function() {
                    $risk.text('Error');
                }).always(function() {
                    if (callback) {
                        callback();
                    }
                });
            },

            renderFraudReport: function(callback) {

                var $fraud = this.$el.find('.additional-analysis-fraud');
                var name = this.$el.find(".company-name").text();
                var street = this.$el.find('.address-street').text();
                var city = this.$el.find('.address-city').text();
                var state = this.$el.find('.address-state').text();

                $fraud.text('Loading...');

                $.ajax({
                    url: '/api/fraudreport',
                    type: 'GET',
                    data: {name: name, street: street, city: city, state: state}
                }).done(function(response) {
                        var description = response.description || 'No Report';

                        $fraud.text(description);

                    }).fail(function() {
                        $fraud.text('Error');
                    }).always(function() {
                        if (callback) {
                            callback();
                        }
                    });
            },

            renderViabilityLookup: function(callback) {
                var duns = this.$el.find(".company-details").data('duns');
                var $viability = this.$el.find('.additional-analysis-viability');

                $viability.text('Loading...');

                $.ajax({
                    url: '/api/viabilitylookup',
                    type: 'GET',
                    data: {duns: duns}
                }).done(function(response) {
                    var description = response.description || 'No Report';
                    $viability.text(description);
                }).fail(function() {
                    $viability.text('Error');
                }).always(function() {
                    if (callback) {
                        callback();
                    }
                });
            },

            renderMap : function(selector, streetViewSelector, startingType, startingZoom) {
                var $map = this.$el.find(selector);
                var $streetViewMap = this.$el.find(streetViewSelector);
                var startingLat = this.company.get("details").get("geo.lat");
                var startingLng = this.company.get("details").get("geo.lng");
                var location = new google.maps.LatLng(startingLat, startingLng);
                if (startingLat) {
                    var mapOptions = {
                        zoom: startingZoom,
                        center: location,
                        mapTypeId: google.maps.MapTypeId[startingType.toUpperCase()]
                    };
                    map = new google.maps.Map($map.get(0), mapOptions);
                    var panoramaOptions = {
                        position: location,
                        pov: {
                            heading: 34,
                            pitch: 10
                        }
                    };
                    var panorama = new  google.maps.StreetViewPanorama($streetViewMap.get(0),panoramaOptions);
                    map.setStreetView(panorama);
                } else {
                    $map.hide();
                    $streetViewMap.hide();
                }
            },

            renderSearchResultsTabs : function(){
                if (!this.company.get("details").get("name") || this.company.get("details").get("name") == "undefined"){
                    this.$el.find(".search-results").html("<h5>N/A</h5>");
                    return;
                }
                this.$el.find(".search-results").html(this.templateSearchTabs());
                this.$el.find(".search-results a[data-toggle=\"tab\"]");
                this.renderSearchResults("web");
                
            },

            renderSearchResults : function(searchType, query) {
                var url         = "https://ajax.googleapis.com/ajax/services/search/" +searchType,
                    query       = query || this.company.get("details").getQuery(),
                    data        = {
                        v : "1.0",
                        q : query
                    },
                    that = this;

                $.ajax({
                    url: url,
                    type: 'GET',
                    data : data,
                    crossDomain: true,
                    dataType: 'jsonp',
                    success: function(data) { 
                        
                        if (data.responseData && data.responseData.results) {
                            var searchResults = new SearchResultCollection(data.responseData.results);
                            that.$el.find(".search-results-container").html(that.templateSearchResults({
                                query           : query,
                                searchType      : searchType,
                                searchResults   : searchResults,
                                resultCount     : data.responseData.cursor.resultCount,
                                moreResultsUrl  : data.responseData.cursor.moreResultsUrl
                            }));
                        } else {
                            that.$el.find(".search-results-container").html("Error fetching search results");
                        }
                    },
                    error: function() {
                        that.$el.find(".search-results-container").html("Error fetching search results");
                    }
                });
            },

            templateAdditional : function() {
                return _.template(AdditionalTemplate)();
            },

            templateSearchTabs : function() {
                return _.template(SearchTabsTemplate)({
                    details : this.company.get("details")
                });
            },

            templateSearchResults : function(options) {
                return _.template(SearchResultsTemplate)(options);
            },

            templateDetails : function() {
                return _.template(DetailsTemplate)({
                    details : this.company.get("details")
                });
            },

            template : function() {
                return _.template(CompanyTemplate)({
                    company : this.company
                });
            },

            render:function (eventName) {
                var that = this;
                this.delegateEvents();

                this.$el.html(this.template());
                this.company.get("details").fetch().done(function(data){
                    that.renderDetails();
                }).fail(function(){
                    that.renderDetailsError("Error while fetching company information");
                });

                return this;
            }
        });
    }
);