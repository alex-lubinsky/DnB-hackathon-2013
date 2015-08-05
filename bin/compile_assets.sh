#!/bin/sh

# build dashboard app
echo "Building public/apps/dashboard/build.js"
r.js -o public/apps/dashboard/build.js out=public/compiled/dashboard.js baseUrl=public/apps/dashboard/

# build css
#lessc -x public/stylesheets/less/site.less >> public/compiled/site.css
