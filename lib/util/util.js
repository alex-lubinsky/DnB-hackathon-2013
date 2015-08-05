'use strict';

function jsonResponse(req, res, err, response) {
    res.contentType('json');
    if (err) {
        console.log('ERROR');
        console.log(err);
        response = response || {};
        response.ok = false;
        response.errorMessage = err.message || JSON.stringify(err);
        res.json(response, 500);
    } else {
        if (!response) {
            response = {};
        }
        if (typeof response.ok === 'undefined') {
            response.ok = true;
        }
        res.json(response);
    }
}

function urlSafe(string) {
    return (string || '')
        .toLowerCase()
        .replace(/[\/ \?]+/g, '-')
        .replace(/[^a-z0-9\-\_]+/gi, '')
        .replace(/\-+/g, '-')
        .replace(/^\-+/g, '')
        .replace(/\-+$/g, '');
}

function pad(str, val, length) {
    var left = length >= 0;
    var padding = '';
    var needed = Math.ceil(Math.abs(length || 0) - (str && (''+str).length || 0), 0);

    while(needed-- > 0) {
        padding += ''+val;
    }

    str = left ? padding+str : str+padding;

    return str;
}

function capitalize(str) {
    if (str) {
        str = str.substr(0,1).toLocaleUpperCase()+str.substr(1);
    }
    return str;
}

function truncateText(str, length, indicator) {

    var result = str;

    if (typeof indicator === 'undefined') {
        indicator = '…';
    }

    if (str) {
        if (str.length > length) {
            if (indicator.length > length) {
                result = indicator.substr(0, length);
            } else {
                result = str.substr(0, length-indicator.length)+indicator;
            }
        }
    }

    return result;
}

var DATE_REGEX_US = /^(\d+)\/(\d+)\/(\d+)$/;
var DATE_REGEX_STANDARD = /^(\d+)-(\d+)-(\d+)$/;

function toDate(value) {
    var dateVal = null;
    var year = null;
    var month = null;
    var day = null;
    var currMatch;

    if (value) {

        // need to get relevant year, month and day

        if (value instanceof  Date) {
            // we will want to zero out hours, minutes, seconds
            year = value.getUTCFullYear();
            month = value.getUTCMonth();
            day = value.getUTCDate();
        } else {
            // lets try some regexes
            currMatch = DATE_REGEX_US.exec(value);
            if (currMatch) {
                month = currMatch[1] - 1;
                day = currMatch[2];
                year = currMatch[3];
            } else {
                currMatch = DATE_REGEX_STANDARD.exec(value);
                if (currMatch) {
                    year = currMatch[1];
                    month = currMatch[2] - 1;
                    day = currMatch[3];
                }
            }
        }

        // if we have year month and day, construct UTC date

        if (year !== null) {

            year = parseFloat(year);
            month = parseFloat(month);
            day = parseFloat(day);

            if (year < 100) {
                // two digit year, convert to four digit using cutoff to decide if 2000 or 1900
                year = (2000 + year > env.DATE_PARSE_YEAR_CUTOFF ? 1900 : 2000) + year;
            }
            //treat everything as UTC
            dateVal = new Date(Date.UTC(year, month, day));
        }
    }

    return dateVal;
}

module.exports = {
    jsonResponse: jsonResponse,
    urlSafe: urlSafe,
    pad: pad,
    capitalize: capitalize,
    truncateText: truncateText,
    toDate: toDate
};