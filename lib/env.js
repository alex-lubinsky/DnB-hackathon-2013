'use strict';

var path = require('path');

var env = {};

env.isNodeUnit = process.argv[1] && process.argv[1].match(/nodeunit$/);

env.SERVER_ENV = env.NODE_ENV === 'production' ? 'prod' : 'local';

env.PORT = process.env.PORT || (env.SERVER_ENV === 'prod' ? 80 : 3000);
env.HOST = process.env.HOST || (env.SERVER_ENV === 'prod' ? 'todo' : 'localhost:'+env.PORT);

env.VIEW_DIR = path.join(__dirname,'..','views');
env.STATIC_DIR = path.join(__dirname,'..','public');
env.FAVICON = path.join(env.STATIC_DIR, 'images', 'favicon.ico');

env.DEFAULT_PAGE_TITLE = 'DNB Hackathon';

env.DNB_USER = 'hackathon6@dnb.com';
env.DNB_PASSWORD = 'Hackathon123$';

env.AUTH_FILE = path.join(__dirname,'..','auth.json');
env.AUTH_LIFE_MS = 1000 * 60 * 60 * 4; //4 hours

env.DNB_CALL_CACHING_ENABLED = env.SERVER_ENV === 'local' && !env.isNodeUnit;

module.exports = env;