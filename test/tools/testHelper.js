'use strict';

var async = require('async');
var dnb = require('../../lib/components/dnb');

function GlobalTeardown() {
    this.armed = true;
    var self = this;
    setTimeout(function() {
        //only want to close when everything is done
        if (self.armed) {
            /* teardown code here*/
        }
    }, 350);
}

GlobalTeardown.prototype.disarm = function() {
    this.armed = false;
};

var lastGlobalTeardown = null;
var testStart = null;

function testStartDate() {
    return testStart;
}

function _startTest() {
    testStart = new Date();
    if (lastGlobalTeardown) {
        lastGlobalTeardown.disarm();
        lastGlobalTeardown = null;
    }
}

function _endTest(test) {
    if (lastGlobalTeardown) {
        throw new Error('Unexpected overlapping of GlobalTeardown');
    }
    lastGlobalTeardown = new GlobalTeardown();
    test.done();
}

function asyncTest(test, methods) {

    _startTest();

    async.auto({
        globalSetUp: [function(next) {
            dnb.refreshAuth(next);
        }],
        testMethods: ['globalSetUp', function(next) {
            async.auto(methods, next);
        }]
    }, function(err) {
        if (err) {
            throw err;
        }
        _endTest(test);
    });
}

function syncTest(test, func) {
    _startTest();
    func();
    _endTest(test);
}

module.exports = {
    asyncTest: asyncTest,
    syncTest: syncTest,
    testStartDate: testStartDate
};