define(
    [
        'jquery',
        'underscore',
        'backbone',
        'views/new_investigation',
        'views/company',
        'text_loader!templates/layout.ejs.html',
        'text_loader!templates/modals/reference.ejs.html',
        'text_loader!templates/dashboard.ejs.html',
        'text_loader!templates/sidebar.ejs.html',
        'text_loader!templates/company/company.ejs.html',
        'bootstrap'
    ],
    function($, _, Backbone, NewInvestigationView, CompanyView,
            LayoutTemplate, ReferenceModalTemplate, DashboardTemplate, SidebarTemplate,
            CompanyTemplate,
            undefined){
        return Backbone.View.extend({
            tagName: "span",

            initialize : function(options) {
                this.companyCollection = options.companyCollection;
                this.newInvestigationView = new NewInvestigationView({
                    companyCollection : this.companyCollection
                });
                this.newInvestigationView.rendered = false;
            },

            events : {
                "click .new-investigation-link" : "renderNewInvestigation",
                "click .company-select-link" : "selectCompany",
                "click a.nav-reference" : "showReference"
            },

            showReference : function(event) {
                event.preventDefault();
                var $modal = $(_.template(ReferenceModalTemplate)());
                $modal.modal({
                });
                
                $modal.on('hidden.bs.modal', function () {
                    $('.modal-backdrop').addClass("hide");
                });

                return false;
            },

            selectCompany : function(event) {
                var $link = $(event.currentTarget),
                    id = $link.data("id")+"";

                var company = this.companyCollection.findWhere({id:id});

                if (company) {
                    this.renderCompanyView(company);
                    this.renderSidebar();    
                } else {
                    console.log("Couldn't find company with id ", id);
                    console.log("ids: ", this.companyCollection.map(function(c){
                        return c.get("name")+":"+c.get("id");
                    }).join(", "));
                }
            },

            renderSidebar : function() {
                this.$el.find(".dashboard-sidebar").html(this.templateSidebar());
            },

            renderCompanyView : function(company) {
                if (!company.view) {
                    company.view = new CompanyView({
                        company : company,
                        companyCollection : this.companyCollection
                    });
                }
                this.newInvestigationView.remove();
                this.companyCollection.each(function(company){
                    if (company.view) {
                        company.view.remove()
                    }
                });
                this.companyCollection.unselectAll();
                company.set("selected",true);
                this.$el.find(".dashboard-content").html(company.view.render().el);
            },

            renderNewInvestigation : function(event) {
                if (event) {
                    event.preventDefault();
                }
                // Unselect any selected companies & render sidebar
                this.companyCollection.unselectAll();
                this.renderSidebar()

                this.$el.find(".dashboard-content").html(this.newInvestigationView.render().el);

                if (!this.newInvestigationView.rendered) {
                    this.newInvestigationView.rendered = true;
                }

                return false;
            },

            template : function() {
                return _.template(LayoutTemplate)();
            },

            templateDashboard : function() {
                return _.template(DashboardTemplate)();
            },

            templateSidebar : function() {
                var selectedCompany = this.companyCollection.findWhere({selected:true});
                return _.template(SidebarTemplate)({
                    companyCollection : this.companyCollection,
                    selectedCompany : selectedCompany,
                });
            },

            templateCompany : function(options) {
                return _.template(CompanyTemplate)(options);
            },

            render:function (eventName) {
                this.$el.html(this.template());
                this.$el.find(".page.container").html(this.templateDashboard());

                this.renderSidebar();
                this.renderNewInvestigation();

                this.listenTo(this.companyCollection, "selected", this.renderCompanyView);
                this.listenTo(this.companyCollection, "selected", this.renderSidebar);
                return this;
            }
        });
    }
);
