'use strict';

var express = require('express');
var http = require('http');
var path = require('path');

var env = require('./env');
var pages = require('./routes/pages');
var api = require('./routes/api');

var dnb = require('./components/dnb');

var app = express();

app.set('port', env.PORT);
app.set('views', env.VIEW_DIR);
app.set('view engine', 'ejs');

app.use(express.logger('dev'));

app.use(require('less-middleware')({ src: env.STATIC_DIR }));
app.use(express.static(env.STATIC_DIR));
app.use(express.favicon(env.FAVICON));

app.use(express.json());
app.use(express.urlencoded());
app.use(express.multipart());

app.use(function(req, res, next) {
    // make these variables accessible to view engine
    app.locals.env = env;
    app.locals.host = req.headers && req.headers.host;
    next();
});

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.errorHandler());

app.get('/', pages.index);

app.get('/api/textsearch', api.textSearch);
app.get('/api/mainlookup', api.mainLookup);
app.get('/api/phonesearch', api.phoneSearch);
app.get('/api/addresssearch', api.addressSearch);
app.get('/api/principalsearch', api.principalSearch);
app.get('/api/revenuelookup', api.revenueLookup);
app.get('/api/risklookup', api.riskLookup);
app.get('/api/fraudreport', api.fraudReport);
app.get('/api/viabilitylookup', api.viabilityLookup);


// load stored auth from disk
dnb.refreshAuth(function(err) {
    if (err) {
        throw new Error('Error getting DNB Auth; '+JSON.stringify(err));
    }

    // set up periodic refreshing auth
    setInterval(function() {
        dnb.refreshAuth(function(err) {
            if (err) {
                throw new Error('Error refreshing DNB Auth'+JSON.stringify(err));
            } else {
                console.log('Auth refreshed');
            }
        });
    }, env.AUTH_LIFE_MS+1000);

    http.createServer(app).listen(app.get('port'), function() {
        console.log('Host is '+env.HOST);
        console.log('Express server listening on port ' + app.get('port'));
    });

});
