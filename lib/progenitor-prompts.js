

var prompt = require("prompt"), 
    _ = require("underscore"),
    path = require("path"),
    fs = require("fs"),
    progenitor = require("./progenitor");

function exists (path) {
    if (fs.existsSync) {
        return fs.existsSync(path);
    } else {
        return path.existsSync(path);
    }
}

function join (prefix, suffix) {
    return path.resolve(prefix, suffix);
}


exports.prompt = function (argv) {
    var src = join(process.cwd(), argv.src),
        srcDir = path.join(src, "content");
    
    
    
    srcDir = exists(srcDir) ? srcDir : src;
    
    if (argv.verbose) {
        console.log("Collecting required keys from the project " + srcDir);
    }
    
    var existingOptions = {};

    
    var optionsFile = path.join(src, "options.js");
    var userPrompts = !argv.generate && exists(optionsFile)  ? require(optionsFile).properties : null;
    
    var fake = {};
    if (userPrompts) {
        _.each(userPrompts, function (num, key) {
            var value = userPrompts[key];
            if (_.isString(value)) {
                fake[key] = value;
            } else if (_.isString(value.default)) {
                fake[key] = value.default;
            }
        });
    }
    
    var keys = progenitor.collectKeys(srcDir, fake);
    
    if (argv.debug) {
        console.log("All keys found in the template are:");
        console.dir(keys);
    }
    var options = {};
    var optionSelector = progenitor.createOptionSelector(options);
    function end (options) {
        var destDir = join(process.cwd(), argv.dest);    
        console.log("\n\n");
        console.dir(options);
        
        progenitor.textReplaceFileTree(srcDir, destDir, optionSelector, true);
        
        
    }
    
    if (!userPrompts) {
        userPrompts = keys;
    }
    
    if (_.isArray(userPrompts)) {
        var obj = {};
        _.each(userPrompts, function (value) {
            if (_.isString(value)) {
                obj[value] = {};
            } else if (value.name) {
                obj[value.name] = value;
            }
        });
        userPrompts = obj;
    }
    
    if (argv.generate) {
        fs.writeFileSync(optionsFile, "exports.properties = " + require('util').inspect(userPrompts) + ";");
        return;
    }
    
    if (userPrompts) {
        prompt.properties = userPrompts;
        prompt.start();
        prompt.message = "Enter";
        
        var i = 0;
        function defaultTo(obj, key, defaultValue) {
            if (!obj[key]) {
                obj[key] = defaultValue;
            }
        }
        
        
        function next () {
            if (i >= keys.length) {
                end(options);
                return;
            }
            
            var key = keys[i];
            i++;
            var promptObject = userPrompts[key];

            
            if (!promptObject) {
                next();
                return;
            }
            
            if (_.isString(promptObject)) {
                options[key] = promptObject;
                next();
                return;
            }
            
            
            defaultTo(promptObject, "name", key);
            defaultTo(promptObject, "message", promptObject.name);

            if (key.indexOf("email") >= 0) {
                defaultTo(promptObject, "validator", /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i);
                defaultTo(promptObject, "warning",  'Must be a valid email address');
            }
            
            if (promptObject["default"]) {
                promptObject["default"] = progenitor.textReplace(promptObject["default"], optionSelector);
            }
            

            
            prompt.get([key], function (err, result) {
                options[key] = result[key];
                next();
            });
            
        };
        next();
        
    }
    
};