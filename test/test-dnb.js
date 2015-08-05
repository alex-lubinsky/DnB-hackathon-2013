'use strict';

var th = require('./tools/testHelper');
var dnb = require('../lib/components/dnb');

module.exports.testCall = function(test) {

    test.expect(3);

    var route = '/V4.0/organizations';
    var callParams = {
        CountryISOAlpha2Code: 'US',
        SubjectName: 'GORMAN MANUFACTURING',
        match: 'true',
        MatchTypeText: 'Basic',
        TerritoryName: 'CA'
    };

    th.asyncTest(test, {
        performCall: [function(next) {
            dnb.call(route, callParams, next);
        }],
        evaluateResults: ['performCall', function(next, results) {

            var result = results.performCall || {};

            var serviceVersion = result.MatchResponse && result.MatchResponse['@ServiceVersionNumber'];
            var matchCandidates = result.MatchResponse && result.MatchResponse.MatchResponseDetail && result.MatchResponse.MatchResponseDetail.MatchCandidate || [];
            var firstMatch = matchCandidates[0] || {};
            var secondMatch = matchCandidates[1] || {};

            test.equals('4.0', serviceVersion);
            test.equals('804735132', firstMatch.DUNSNumber);
            test.equals('009175688', secondMatch.DUNSNumber);

            next();
        }]
    });

};

module.exports.testTextSearch = function(test) {

    test.expect(2);

    var keywords = 'apple computer';

    th.asyncTest(test, {
        textSearch: [function(next) {
            dnb.textSearch(keywords, next);
        }],
        evaluateResults: ['textSearch', function(next, results) {

            var matchCandidates = results.textSearch;

            var firstMatch = matchCandidates[0] || {};
            var secondMatch = matchCandidates[1] || {};

            test.equals('545280083', firstMatch.DUNSNumber);
            test.equals('743860645', secondMatch.DUNSNumber);

            next();
        }]
    });
};

module.exports.testDunsEnhancedLookup = function(test) {

    test.expect(13);

    th.asyncTest(test, {
        dunsEnhancedLookup: [function(next) {
            dnb.dunsEnhancedLookup('029930707', next);
        }],
        evaluateResults: ['dunsEnhancedLookup', function(next, results) {

            var lookup = results.dunsEnhancedLookup || {};

            test.equals('Apple Computer Center', lookup.name);
            test.equals('(772) 564-6900', lookup.phone);
            test.equals(2, lookup.numEmployees);
            test.equals('2010', lookup.startYear);
            test.equals('Unknown', lookup.type);
            test.equals('George H Durr', lookup.principalEmployee);
            test.equals('14734131', lookup.principalIdentificationNumber);

            test.equals('1964 14TH AVE', lookup.address && lookup.address.street);
            test.equals('Vero Beach', lookup.address && lookup.address.city);
            test.equals('FL', lookup.address && lookup.address.state);
            test.equals('32960', lookup.address && lookup.address.zip);

            test.equals(27.6381, lookup.geo && lookup.geo.lat);
            test.equals(-80.399205, lookup.geo && lookup.geo.lng);

            next();
        }]
    });

};

module.exports.testPhoneSearch = function(test) {

    test.expect(7);

    th.asyncTest(test, {
        phoneSearch: [function(next) {
            dnb.phoneSearch('(571) 814-3679', next);
        }],
        evaluateResults: ['phoneSearch', function(next, results) {

            var matchCandidates = results.phoneSearch;

            var firstMatch = matchCandidates[0] || {};

            test.equals(1, matchCandidates.length);

            test.equals('078747014', firstMatch.dunsNumber);
            test.equals('Video Blocks', firstMatch.name);
            test.equals('10780 Parkridge Blvd 70', firstMatch.address && firstMatch.address.street);
            test.equals('Reston', firstMatch.address && firstMatch.address.city);
            test.equals('VA', firstMatch.address && firstMatch.address.state);
            test.equals('20191', firstMatch.address && firstMatch.address.zip);

            next();
        }]
    });

};

module.exports.testAddressSearch = function(test) {

    test.expect(13);

    var address = {
        street: '901 N Stuart St Ste 1100',
        city: 'Arlington',
        state: 'VA',
        zip: '22203'
    };

    th.asyncTest(test, {
        addressSearch: [function(next) {
            dnb.addressSearch(address, next);
        }],
        evaluateResults: ['addressSearch', function(next, results) {

            var matchCandidates = results.addressSearch;
            var firstMatch = matchCandidates[0] || {};
            var secondMatch = matchCandidates[1] || {};

            test.equals(2, matchCandidates.length);

            test.equals('931155209', firstMatch.dunsNumber);
            test.equals('Applied Predictive Technologies, Inc.', firstMatch.name);
            test.equals('901 N Stuart St Ste 1100', firstMatch.address && firstMatch.address.street);
            test.equals('Arlington', firstMatch.address && firstMatch.address.city);
            test.equals('VA', firstMatch.address && firstMatch.address.state);
            test.equals('22203', firstMatch.address && firstMatch.address.zip);

            test.equals('028130610', secondMatch.dunsNumber);
            test.equals('THE ADMINISTRATORS OF THE TULANE EDUCATIONAL FUND', secondMatch.name);
            test.equals('901 N Stuart St Ste 1100', secondMatch.address && secondMatch.address.street);
            test.equals('Arlington', secondMatch.address && secondMatch.address.city);
            test.equals('VA', secondMatch.address && secondMatch.address.state);
            test.equals('22203', secondMatch.address && secondMatch.address.zip);
            next();
        }]
    });

};

module.exports.testDunsRiskLookup = function(test) {

    test.expect(3);

    th.asyncTest(test, {
        dunsRiskLookup: [function(next) {
            dnb.dunsRiskLookup('029930707', next);
        }],
        evaluateResults: ['dunsRiskLookup', function(next, results) {

            var lookup = results.dunsRiskLookup || {};

            test.equals(486, lookup.commercialCreditScore);
            test.equals('AVERAGE RISK', lookup.riskAssessment);
            test.equals('Payment information', lookup.assementSummary && lookup.assementSummary.substr(0,19));

            next();
        }]
    });

};

module.exports.testDunsRevenueLookup = function(test) {

    test.expect(5);

    th.asyncTest(test, {
        dunsRevenueLookup: [function(next) {
            dnb.dunsRevenueLookup('949477959', next);
        }],
        evaluateResults: ['dunsRevenueLookup', function(next, results) {

            var lookup = results.dunsRevenueLookup || {};

            test.equals(48000, lookup.amount);
            test.equals(48, lookup.unitAmount);
            test.equals('Thousand', lookup.unitOfSize);
            test.equals('USD', lookup.currency);
            test.equals('$48 Thousand', lookup.text);

            next();
        }]
    });

};

module.exports.testFraudReport = function(test) {

    test.expect(1);

    var address = {
        street: '492 Koller Street',
        city: 'San Francisco',
        state: 'CA'
    };

    var name = 'Gorman Manufacturing';

    th.asyncTest(test, {
        fraudReport: [function(next) {
            dnb.fraudReport(name, address, next);
        }],
        evaluateResults: ['fraudReport', function(next, results) {

            var lookup = results.fraudReport || {};

            test.equals('Reduced Fraud Risk', lookup.description);

            next();
        }]
    });

};

module.exports.testFraudReport = function(test) {

    test.expect(1);

    th.asyncTest(test, {
        dunsViabilityLookup: [function(next) {
            dnb.dunsViabilityLookup('804735132', next);
        }],
        evaluateResults: ['dunsViabilityLookup', function(next, results) {

            var lookup = results.dunsViabilityLookup || {};

            test.equals('Low', lookup.description);

            next();
        }]
    });

};

module.exports.testPrincipalSearch = function(test) {

    test.expect(3);

    var employee = 'Michael Dell';
    var id = 'n/a';

    th.asyncTest(test, {
        principalSearch: [function(next) {
            dnb.principalSearch(employee, id, next);
        }],
        evaluateResults: ['principalSearch', function(next, results) {

            var matchCandidates = results.principalSearch;

            var firstMatch = matchCandidates[0] || {};
            var secondMatch = matchCandidates[1] || {};

            test.equals(4, matchCandidates.length);
            test.equals('736964078', firstMatch.dunsNumber);
            test.equals('043952030', secondMatch.dunsNumber);

            next();
        }]
    });
};
