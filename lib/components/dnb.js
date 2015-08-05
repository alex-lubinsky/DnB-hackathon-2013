'use strict';

var fs = require('fs');
var querystring = require('querystring');
var async = require('async');
var request = require('request');
var _ = require('underscore');
var util = require('../util/util');
var env = require('../env');

var API_ENTRY_POINT = 'https://maxcvservices.dnb.com';

var currAuthKey = null;

var localCache = {};

/**
 * Updates the authentication for dnb calls if necessary
 * @param callback
 */
function refreshAuth(callback) {
    _checkCachedAuth(function(err, auth) {
        if (!err && currAuthKey !== auth) {
            currAuthKey = auth;
        }
        callback(err, auth);
    });
}

/**
 * Requests a new auth key
 * @private
 */
function _requestAuth(callback) {
    async.auto({
        request: [function(next) {
            var uri = 'https://maxcvservices.dnb.com/rest/Authentication';
            var headers = {
                'x-dnb-user': env.DNB_USER,
                'x-dnb-pwd': env.DNB_PASSWORD
            };

            var requestOptions = {
                uri: uri,
                method: 'POST',
                headers: headers
            };

            console.log('REQUEST OPTIONS');
            console.log(requestOptions);

            request.get(requestOptions, next);

        }],
        getAuth: ['request', function(next, results) {
            var response = results.request[0];
            var body = results.request[1];
            var result;

            if (!response) {
                console.log('Error: request failed');
                return next(new Error('Request failed'));
            } else if (response.statusCode !== 200) {
                console.log('Error: bad status code ',response.statusCode);
                return next(new Error('Request failed with status code '+response.statusCode+'; '+body));
            } else {
                result = response.headers && response.headers['authorization'];
            }

            next(null, result);
        }]
    }, function(err, results) {
        callback(err, results && results.getAuth);
    });
}

/**
 * Checks cached auth and requests and writes a new one if necessary. Returns auth key to use.
 * @param callback function(err, auth)
 */
function _checkCachedAuth(callback) {

    var fileContents = fs.existsSync(env.AUTH_FILE) && fs.readFileSync(env.AUTH_FILE);
    var fileJson = fileContents && JSON.parse(fileContents);
    if (fileJson && new Date().getTime() - fileJson.createdMs < env.AUTH_LIFE_MS) {
        if (!env.isNodeUnit) {
            console.log('Using existing auth');
        }
        callback(null, fileJson.authentication);
    } else {
        console.log('Requesting new auth');
        async.auto({
            requestAuth: [function(next) {
                _requestAuth(next);
            }],
            storeAuth: ['requestAuth', function(next, results) {
                var auth = results.requestAuth;
                var fileContents = '{\n' +
                                   '    "authentication": "'+auth+'",\n' +
                                   '    "createdMs": '+(new Date().getTime())+'\n' +
                                   '}';

                if (!auth) {
                    return next(new Error('No new auth returned'));
                }

                console.log('New auth retrieved');

                fs.writeFile(env.AUTH_FILE, fileContents, next);
            }]
        }, function(err, results) {
            callback(err, results && results.requestAuth);
        });
    }
}

/**
 * Performs a DNB API Call
 * @param route the route of the call, i.e. /V4.0/organizations)
 * @param params the parameters of the call
 * @param uriDelegate an optional delegate to apply on the final uri for last minute post-processing; function(uri)
 * @param callback function(err, response)
 */
function call(route, params, uriDelegate, callback) {

    if (typeof params === 'function') {
        uriDelegate = params;
        params = null;
    }

    if (typeof callback === 'undefined') {
        callback = uriDelegate;
        uriDelegate = null;
    }

    async.auto({
        request: [function(next) {
            var uri = API_ENTRY_POINT+route+(params ? '?'+querystring.stringify(params) : '');
            var headers = {
                Authorization: currAuthKey
            };

            if (uriDelegate) {
                uri = uriDelegate(uri);
            }

            //console.log('hitting', uri);

            var requestOptions = {
                uri: uri,
                method: 'GET',
                headers: headers
            };

            console.log('hitting uri', uri);

            // caching
            if (env.DNB_CALL_CACHING_ENABLED && localCache[uri]) {
                console.log('Using cached call for '+uri);
                next(null, {statusCode: 200}, localCache[uri]);
            }

            request.get(requestOptions, function(err, response, body) {
                if (response && (response.statusCode === 401 || response.statusCode === 400)) {
                    console.log('Failed response, trying again');
                    setTimeout(function() {
                        request.get(requestOptions, next);
                    }, 2000);
                } else {
                    next(err, response, body);
                }
            });
        }],
        eval: ['request', function(next, results) {
            var response = results.request[0];
            var body = results.request[1];
            var uri = API_ENTRY_POINT+(response && response.req && response.req.path);
            var result;

            if (!response) {
                console.log('Error: request failed');
                return next(new Error('Request failed'));
            } else if (response.statusCode !== 200 && response.statusCode !== 404) {
                console.log('Error: bad status code ',response.statusCode);
                return next(new Error('Request failed with status code '+response.statusCode+'; '+body));
            } else {
                // 404 status code returned when no match so we'll return null
                if (response.statusCode === 200) {
                    try {
                        result = JSON.parse(body);

                        if (env.DNB_CALL_CACHING_ENABLED && !localCache[uri]) {
                            localCache[uri] = body;
                            console.log('Cached call result for '+uri);
                        }

                    } catch(e) {
                        console.log('parse error ',e);
                    }
                    if (!result) {
                        console.log('Error: cannot parse');
                        return next(new Error('Failed to parse response'));
                    }
                }
            }

            next(null, result);
        }]
    }, function(err, results) {
        callback(err, results && results.eval);
    });
}

/**
 * Searches for companies based on keyword
 * @param text the textual keywords to search for
 * @param callback function(err, companies)
 */
function textSearch(text, callback) {

    var route = '/V6.0/organizations';
    var params = {
        CountryISOAlpha2Code: 'US', //hard code to US for now
        KeywordText: text,
        findcompany: 'true'
    };

    call(route, params, function(err, response) {
        var matchCandidates = response && response.FindCompanyResponse && response.FindCompanyResponse.FindCompanyResponseDetail && response.FindCompanyResponse.FindCompanyResponseDetail.FindCandidate || [];
        callback(err, matchCandidates);
    });
}

/**
 * Performs an enhanced duns lookup
 * @param duns the duns number
 * @param callback function(err, company)
 */
function dunsEnhancedLookup(duns, callback) {

    var route = '/V2.1/organizations/'+duns+'/products/DCP_ENH';

    call(route, function(err, response) {
        var organization = response && response.OrderProductResponse && response.OrderProductResponse.OrderProductResponseDetail && response.OrderProductResponse.OrderProductResponseDetail.Product && response.OrderProductResponse.OrderProductResponseDetail.Product.Organization;
        var prunedResult;
        var subjectHeader =  organization && organization.SubjectHeader || {};
        var locationPrimaryAddress = organization && organization.Location && organization.Location.PrimaryAddress && organization.Location.PrimaryAddress[0] || {};

        if (organization) {

            prunedResult = {name: organization.OrganizationName && organization.OrganizationName.OrganizationPrimaryName && organization.OrganizationName.OrganizationPrimaryName[0] && organization.OrganizationName.OrganizationPrimaryName[0].OrganizationName && organization.OrganizationName.OrganizationPrimaryName[0] && organization.OrganizationName.OrganizationPrimaryName[0].OrganizationName.$,
                            startYear: organization.OrganizationDetail && organization.OrganizationDetail.OrganizationStartYear,
                            type: organization.RegisteredDetail && organization.RegisteredDetail.LegalFormDetails && organization.RegisteredDetail.LegalFormDetails.LegalFormText && organization.RegisteredDetail.LegalFormDetails.LegalFormText.$,
                            dunsLastUpdateDate: util.toDate(subjectHeader.LastUpdateDate && subjectHeader.LastUpdateDate.$),
                            phone: organization.Telecommunication && organization.Telecommunication.TelephoneNumber && organization.Telecommunication.TelephoneNumber[0] && organization.Telecommunication.TelephoneNumber[0].TelecommunicationNumber,
                            numEmployees: organization.EmployeeFigures && organization.EmployeeFigures.IndividualEntityEmployeeDetails && organization.EmployeeFigures.IndividualEntityEmployeeDetails.TotalEmployeeQuantity,
                            principalEmployee: organization.PrincipalsAndManagement && organization.PrincipalsAndManagement.CurrentPrincipal && organization.PrincipalsAndManagement.CurrentPrincipal[0] && organization.PrincipalsAndManagement.CurrentPrincipal[0].PrincipalName && organization.PrincipalsAndManagement.CurrentPrincipal[0].PrincipalName.FullName,
                            principalIdentificationNumber: organization.PrincipalsAndManagement && organization.PrincipalsAndManagement.CurrentPrincipal && organization.PrincipalsAndManagement.CurrentPrincipal[0] && organization.PrincipalsAndManagement.CurrentPrincipal[0].PrincipalIdentificationNumberDetail && organization.PrincipalsAndManagement.CurrentPrincipal[0].PrincipalIdentificationNumberDetail[0] && organization.PrincipalsAndManagement.CurrentPrincipal[0].PrincipalIdentificationNumberDetail[0].PrincipalIdentificationNumber
            };

            prunedResult.address = {
                street: locationPrimaryAddress.StreetAddressLine[0] && locationPrimaryAddress.StreetAddressLine[0].LineText,
                city: locationPrimaryAddress.PrimaryTownName,
                state: locationPrimaryAddress.TerritoryAbbreviatedName,
                zip: locationPrimaryAddress.PostalCode && locationPrimaryAddress.PostalCode.substr(0,5)
            };

            prunedResult.geo = {
                lat: locationPrimaryAddress.LatitudeMeasurement,
                lng: locationPrimaryAddress.LongitudeMeasurement
            }
        }

        callback(err, prunedResult);
    });
}

/**
 * Searches for companies with the given phone (or fax) number
 * @param phone the seven-digit phone number
 * @param callback function(err, companies)
 */
function phoneSearch(phone, callback) {

    var cleanedNumber = (''+phone).replace(/\D/g,'');

    async.auto({
        textSearch: [function(next) {
            textSearch(cleanedNumber, next);
        }]
    }, function(err, results) {
        var companies = results && results.textSearch || [];

        companies = companies.filter(function(company) {
            return (company.TelephoneNumber && ''+company.TelephoneNumber.TelecommunicationNumber === cleanedNumber)
                   || (company.FacsimileNumber && ''+company.FacsimileNumber.TelecommunicationNumber === cleanedNumber);
        });

        callback(err, _pruneCompanies(companies));
    });
}

/**
 * Searches for companies with the given address
 * @param address object with address info: {street, city, state, zip};
 * @param callback function(err, companies)
 */
function addressSearch(address, callback) {

    var route = '/V4.0/organizations';

    var searchParams = {
        'StreetAddressLine-1': address.street.replace(/\s+/g,'+'),
        'PrimaryTownName-1': address.city.replace(/\s+/g,'+'),
        'TerritoryName-1': address.state,
        'PostalCode-1': address.zip,
        'CountryISOAlpha2Code-1': 'US' //keep in US for now
    };

    var uriDelegate = function(uri) {
        //unescape plus signs
        return uri.replace(/%2B/g,'+');
    };

    // additional params needed for API call //
    searchParams.SearchModeDescription = 'Advanced';
    searchParams.findcompany = 'true';

    async.auto({
        call: [function(next) {
            call(route, searchParams, uriDelegate, next);
        }]
    }, function(err, results) {
        var response = results && results.call;
        var matchCandidates = response && response.FindCompanyResponse && response.FindCompanyResponse.FindCompanyResponseDetail && response.FindCompanyResponse.FindCompanyResponseDetail.FindCandidate || [];
        callback(err, _pruneCompanies(matchCandidates));
    });
}

/**
 * Performs an risk duns lookup
 * @param duns the duns number
 * @param callback function(err, company)
 */
function dunsRiskLookup(duns, callback) {

    var route = '/V3.0/organizations/'+duns+'/products/SBCRP';

    call(route, function(err, response) {
        var organization = response && response.OrderProductResponse && response.OrderProductResponse.OrderProductResponseDetail && response.OrderProductResponse.OrderProductResponseDetail.Product && response.OrderProductResponse.OrderProductResponseDetail.Product.Organization;
        var result = {};

        result.commercialCreditScore = organization && organization.Assessment && organization.Assessment.CommercialCreditScore && organization.Assessment.CommercialCreditScore[0]  && organization.Assessment.CommercialCreditScore[0].RawScore;
        result.riskAssessment = organization && organization.Assessment && organization.Assessment.CommercialCreditScore && organization.Assessment.CommercialCreditScore[0]  && organization.Assessment.CommercialCreditScore[0].ClassScoreDescription;
        result.assementSummary = organization && organization.Assessment && organization.Assessment.AssessmentSummaryText && organization.Assessment.AssessmentSummaryText.join(' ');

        callback(err, result);
    });
}

function dunsFinancialStressLookup(duns, callback) {


    var route = '/V3.0/organizations/'+duns+'/products/SBCRP';

}

function dunsRevenueLookup(duns, callback) {

    var route = '/V4.0/organizations';
    var params = {
        'DUNSNumber-1': duns,
        SearchModeDescription: 'Advanced',
        findcompany: true
    };

    call(route, params, function(err, response) {
        var candidate = response && response.FindCompanyResponse && response.FindCompanyResponse.FindCompanyResponseDetail && response.FindCompanyResponse.FindCompanyResponseDetail.FindCandidate && response.FindCompanyResponse.FindCompanyResponseDetail.FindCandidate[0];
        var revenue = candidate && candidate.SalesRevenueAmount;
        var result;

        if (revenue && revenue['@CurrencyISOAlpha3Code'] && revenue['@UnitOfSize'] && revenue['$']) {
            result = {
                unitAmount: revenue['$'],
                unitOfSize: revenue['@UnitOfSize'],
                currency: revenue['@CurrencyISOAlpha3Code']
            };

            if (result.unitOfSize === 'Million') {
                result.amount = result.unitAmount * 1000000;
                if (result.unitAmount < 1) {
                    result.unitOfSize = 'Thousand';
                    result.unitAmount *= 1000;
                } else if (result.unitAmount >= 1000) {
                    result.unitOfSize = 'Billion';
                    result.unitAmount /= 1000.0;
                }
            }

            result.text = result.currency === 'USD' ? '$'+result.unitAmount+' '+result.unitOfSize : result.unitAmount+' '+result.unitOfSize+' '+result.currency;
        }

        callback(err, result);
    });

}

/**
 * Searches for companies with the given address
 * @param name name of company};
 * @param address object with address info: {street, city, state};
 * @param callback function(err, companies)
 */
function fraudReport(name, address, callback) {

    var route = '/V4.0/organizations';

    var searchParams = {
        'SubjectName': name,
        'StreetAddressLine-1': address.street,
        'PrimaryTownName': address.city,
        'TerritoryName': address.state,
        'CountryISOAlpha2Code': 'US', //keep in US for now,
        'fraudscore': true
    };

    async.auto({
        call: [function(next) {
            call(route, searchParams, next);
        }]
    }, function(err, results) {
        var response = results && results.call;
        var fraudRiskScore = response && response.GetFraudScoreResponse && response.GetFraudScoreResponse.GetFraudScoreResponseDetail && response.GetFraudScoreResponse.GetFraudScoreResponseDetail.FraudRiskScore;
        var result;

        if (fraudRiskScore) {
            result = {
                description: fraudRiskScore.ClassScoreDescription
            }
        }

        callback(err, result);
    });
}

/**
 * Performs a viability duns lookup
 * @param duns the duns number
 * @param callback function(err, company)
 */
function dunsViabilityLookup(duns, callback) {

    var route = '/V3.0/organizations/'+duns+'/products/VIAB_RAT';

    call(route, function(err, response) {
        var assessment = response && response.OrderProductResponse && response.OrderProductResponse.OrderProductResponseDetail && response.OrderProductResponse.OrderProductResponseDetail.Product && response.OrderProductResponse.OrderProductResponseDetail.Product.Organization && response.OrderProductResponse.OrderProductResponseDetail.Product.Organization.Assessment;
        var description = assessment && assessment.DNBViabilityRating && assessment.DNBViabilityRating.ViabilityScore && assessment.DNBViabilityRating.ViabilityScore.RiskLevelDescription && assessment.DNBViabilityRating.ViabilityScore.RiskLevelDescription.$;
        var result;


        if (response) {
            result = {description: description}
        }

        callback(err, result);
    });
}

/**
 * Searches for companies with the given address
 * @param name the full name of the principal;
 * @param id the PrincipalIdentificationNumber;
 * @param callback function(err, companies)
 */
function principalSearch(name, id, callback) {

    var route = '/V6.0/organizations';

    var searchParams = {
        KeywordText: name,
        findcontact: 'true',
        SearchModeDescription: 'Advanced',
        CandidatePerPageMaximumQuantity: 10
    };

    async.auto({
        call: [function(next) {
            call(route, searchParams, next);
        }]
    }, function(err, results) {
        var response = results && results.call;

        var matchCandidates = response && response.FindContactResponse && response.FindContactResponse.FindContactResponseDetail && response.FindContactResponse.FindContactResponseDetail.FindCandidate || [];

        var prunedCompanies = _pruneCompanies(matchCandidates);

        var duns = {};

        // filter out duplicate duns
        var filteredCompanies = prunedCompanies.filter(function(company) {
            var duplicate = !!(duns[company.dunsNumber]);
            duns[company.dunsNumber] = true;
            return !duplicate;
        });

        callback(err, filteredCompanies);
    });
}

/**
 * Helper function prunes core info about an array of companies
 * @param dunsOrganizations
 * @private
 */
function _pruneCompanies(dunsOrganizations) {
    var result = dunsOrganizations && _.map(dunsOrganizations, function(organization) {

        var prunedResult = {
            dunsNumber: organization.DUNSNumber,
            name: organization.OrganizationPrimaryName && organization.OrganizationPrimaryName.OrganizationName && organization.OrganizationPrimaryName.OrganizationName.$
        };

        var locationPrimaryAddress = organization.PrimaryAddress || {};

        prunedResult.address = {
            street: locationPrimaryAddress.StreetAddressLine && locationPrimaryAddress.StreetAddressLine[0] && locationPrimaryAddress.StreetAddressLine[0].LineText,
            city: locationPrimaryAddress.PrimaryTownName,
            state: locationPrimaryAddress.TerritoryAbbreviatedName,
            zip: locationPrimaryAddress.PostalCode && locationPrimaryAddress.PostalCode.substr(0,5)
        };

        return prunedResult;

    });

    return result;
}


module.exports = {
    refreshAuth: refreshAuth,
    call: call,
    textSearch: textSearch,
    dunsEnhancedLookup: dunsEnhancedLookup,
    phoneSearch: phoneSearch,
    addressSearch: addressSearch,
    dunsRiskLookup: dunsRiskLookup,
    dunsRevenueLookup: dunsRevenueLookup,
    fraudReport: fraudReport,
    dunsViabilityLookup: dunsViabilityLookup,
    principalSearch: principalSearch
};