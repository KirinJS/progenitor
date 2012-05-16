

var prompt = require("prompt"), 
    _ = require("underscore"),
    path = require("path"),
    fs = require("fs"),
    assert = require("assert"),
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
var defaultTemplateDir = path.join(__dirname, "..", "templates");

function checkTemplateName (templateDir, name) {
    var myTemplatePath = path.join(templateDir, name);
    if (exists(myTemplatePath)) {
        return myTemplatePath;
    } else {
        return null;
    }
}


function getExistingTemplateNames (templateDir) {
    return fs.readdirSync(templateDir);
}

function validateArgs(argv) {
    var templateDir = argv.templates || defaultTemplateDir;
    templateDir = path.resolve(process.cwd, templateDir);
    if (argv.template) {
        var templateSrc = checkTemplateName(templateDir, argv.template);
        if (!templateSrc) {
            var templates = getExistingTemplateNames(templateDir);
            templates.unshift("Ready made templates available are:");
            throw templates.join("\n * ");
        }
        argv.src = templateSrc;
    }
}

exports.format = progenitor.template;

function generatePromptsFile(promptsFile, skeletonFilename, options) {
    var skeleton = path.resolve(__dirname, skeletonFilename);
    if (exists(skeleton)) {
        var optionSelector = progenitor.createOptionSelector(options);
        progenitor.template(skeleton, promptsFile, optionSelector);
    }
}

exports.prompt = function (argv, callback) {
    validateArgs(argv);
    var src = join(process.cwd(), argv.src),
        srcDir = path.join(src, "content");
    
    
    
    srcDir = exists(srcDir) ? srcDir : src;
    
    if (argv.verbose) {
        console.log("Collecting required keys from the project " + srcDir);
    }
    
    var existingOptions = {};

    
    var promptsFile = path.join(src, "prompts.js"),
        promptsObject = null;
    
    var userPrompts = null;
    if (exists(promptsFile)) {
        
        var promptsObject = require(promptsFile);
        if (argv.generate) {
            userPrompts = null;
        } else {
            userPrompts = promptsObject.prompts;
            if (promptsObject.overrides) {
                argv = _.extend(argv, promptsObject.overrides);
            }
        }
        
        
    }
    
    var header = promptsObject ? promptsObject.header : null;
    
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
    var destDir = join(process.cwd(), argv.dest);    
    var optionsFile = join(destDir, "options.js");
    
    
    if (!userPrompts) {
        userPrompts = keys;
    }
    
    if (_.isArray(userPrompts)) {
        var obj = {};
        _.each(userPrompts, function (value) {
            if (!value) {
                return;
            }
            if (_.isString(value)) {
                obj[value] = {};
            } else if (value.name) {
                obj[value.name] = value;
            }
        });
        userPrompts = obj;
    }
    
    if (argv.generate) {
        generatePromptsFile(promptsFile, "prompts.skeleton.js", {
            prompts: require('util').inspect(userPrompts)
        });
        return;
    }
    
    
    assert.ok(userPrompts);
    assert.ok(_.isObject(userPrompts));
    
        prompt.properties = userPrompts;
        
        prompt.message = "Enter";
        
        var options = exists(optionsFile) ? require(optionsFile).options : {};
    // if we've been handed an options object in the arguments, we should 
    // use it.
    if (argv.options && !_.isObject(argv.options)) {
        options = _.extend(options, argv.options);
    }
    if (argv.debug) {
        console.log("Getting existing options from argv and pre-existing templates");
        console.dir(options);
    }
    
        var optionSelector = progenitor.createOptionSelector(options);
        
        function end (options) {
            progenitor.textReplaceFileTree(srcDir, destDir, optionSelector, true);
            if (argv.writeOptions) {
                generatePromptsFile(optionsFile, "options.skeleton.js", {                
                    options: require('util').inspect(options),
                    timestamp: "" + new Date()
                });
            }
            if (_.isFunction(callback)) {
                callback(options);
            }
        }
        
        var i = 0;
        function defaultTo(obj, key, defaultValue) {
            if (!obj[key]) {
                obj[key] = defaultValue;
            }
        }
        
        var isStarted = false;
        function next () {
            if (i >= keys.length) {
                end(options);
                return;
            }
            
            var key = keys[i];
            i++;
            var promptObject = optionSelector(key) || userPrompts[key];

            
            if (_.isUndefined(promptObject)) {
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
            if (!isStarted) {
                if (header) {
                    console.log(header);
                }
                
                prompt.start();
                isStarted = true;
            }
            prompt.get(promptObject, function (err, result) {
                options[key] = result[key];
                next();
            });
            
        };
        next();
        
    
};