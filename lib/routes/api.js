'use strict';

var async = require('async');
var util = require('../util/util');
var dnb = require('../components/dnb');

exports.textSearch = function(req, res) {

    var text = req.param('text','');

    async.auto({
        textSearch: [function(next) {
            dnb.textSearch(text, next);
        }]
    }, function(err, results) {
        var response = {companies: results && results.textSearch || []};
        util.jsonResponse(req, res, err, response);
    });

};

exports.mainLookup = function(req, res) {

    var duns = req.param('duns');

    async.auto({
        dunsEnhancedLookup: [function(next) {
            if (!duns) {
                return next(new Error('Missing duns number'));
            }
            dnb.dunsEnhancedLookup(duns, next);
        }]
    }, function(err, results) {
        util.jsonResponse(req, res, err, results && results.dunsEnhancedLookup);
    });

};

exports.phoneSearch = function(req, res) {

    var phone = req.param('phone');

    async.auto({
        phoneSearch: [function(next) {
            if (!phone) {
                return next(new Error('Missing phone number for search'));
            }
            dnb.phoneSearch(phone, next);
        }]
    }, function(err, results) {
        util.jsonResponse(req, res, err, results && {companies: results.phoneSearch || []});
    });
};

exports.addressSearch = function(req, res) {

    var street = req.param('street');
    var city = req.param('city');
    var state = req.param('state');
    var zip = req.param('zip');

    async.auto({
        addressSearch: [function(next) {
            if (!street) {
                return next(new Error('Missing street component of address for search'));
            } else if (!city) {
                return next(new Error('Missing city component of address for search'));
            } else if (!state) {
                return next(new Error('Missing state component of address for search'));
            } else if (!zip) {
                return next(new Error('Missing zip component of address for search'));
            }
            dnb.addressSearch({street: street, city: city, state: state, zip: zip}, next);
        }]
    }, function(err, results) {
        util.jsonResponse(req, res, err, results && {companies: results.addressSearch || []});
    });

};

exports.revenueLookup = function(req, res) {

    var duns = req.param('duns');

    async.auto({
        dunsRevenueLookup: [function(next) {
            if (!duns) {
                return next(new Error('Missing duns number'));
            }
            dnb.dunsRevenueLookup(duns, next);
        }]
    }, function(err, results) {
        util.jsonResponse(req, res, err, results && results.dunsRevenueLookup);
    });

};

exports.riskLookup = function(req, res) {

    var duns = req.param('duns');

    async.auto({
        dunsRiskLookup: [function(next) {
            if (!duns) {
                return next(new Error('Missing duns number'));
            }
            dnb.dunsRiskLookup(duns, next);
        }]
    }, function(err, results) {
        util.jsonResponse(req, res, err, results && results.dunsRiskLookup);
    });

};

exports.viabilityLookup = function(req, res) {

    var duns = req.param('duns');

    async.auto({
        dunsViabilityLookup: [function(next) {
            if (!duns) {
                return next(new Error('Missing duns number'));
            }
            dnb.dunsViabilityLookup(duns, next);
        }]
    }, function(err, results) {
        util.jsonResponse(req, res, err, results && results.dunsViabilityLookup);
    });

};




exports.fraudReport = function(req, res) {

    var name = req.param('name');
    var street = req.param('street');
    var city = req.param('city');
    var state = req.param('state');

    async.auto({
        fraudReport: [function(next) {
            if (!name) {
                return next(new Error('Missing name for search'));
            } else if (!street) {
                return next(new Error('Missing street component of address for search'));
            } else if (!city) {
                return next(new Error('Missing city component of address for search'));
            } else if (!state) {
                return next(new Error('Missing state component of address for search'));
            }

            dnb.fraudReport(name, {street: street, city: city, state: state}, next);
        }]
    }, function(err, results) {
        util.jsonResponse(req, res, err, results && results.fraudReport);
    });

};

exports.principalSearch = function(req, res) {

    var name = req.param('name');

    async.auto({
        principalSearch: [function(next) {
            if (!name) {
                return next(new Error('Missing name for search'));
            }

            dnb.principalSearch(name, 'n/a', next);
        }]
    }, function(err, results) {
        util.jsonResponse(req, res, err, results && {companies: results.principalSearch || []});
    });

};

