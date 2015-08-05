// For more info see http://requirejs.org/docs/optimization.html and
// https://github.com/jrburke/r.js/blob/master/build/example.build.js
(function(){
    return {

        // Name of input file (without the .js extention)
        "name": "main",

        // Directory containing input file
        "baseUrl": "",
        //"baseUrl": "",

        // Look in this file for the require.config() call and extract it
        "mainConfigFile": "main.js",

        "paths": {
            // Don't attempt to include dependencies whose path begins with webapp/
            "webapp": "empty:",

            // Specify where RequireJS can be found so we can include it in the compiled output file
            "requirejs": "../../lib/requirejs/require"
        },

        // Include the above-mentioned RequireJS library in compiled output
        "include": ["requirejs"],

        // Possible values:
        //  - "none" (to disable minification)
        //  - "uglify2"
        "optimize": "none",

        // If using UglifyJS for script optimization, these config options can be used to pass
        // configuration values to UglifyJS.
        "uglify2": {

            // For all possible 'output' settings see http://lisperator.net/uglifyjs/codegen
            output: {
                beautify: false
            },

            // For all possible 'compress' settings see http://lisperator.net/uglifyjs/compress
            compress: {
                unsafe: false
            },

            warnings: true,

            // UglifyJS can reduce names of local variables and functions usually to single-letters
            mangle: true
        },

        // Inlines the text for any text! dependencies (to avoid the separate XMLHttpRequest calls
        // to load things like HTML template snippets, etc.)
        "inlineText": true,

        // By default, comments that have a license in them are preserved in the output when a
        // minifier is used in the "optimize" option. We can disable this.
        preserveLicenseComments: false
    };
})()