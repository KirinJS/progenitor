/*
 * progenitor
 * https://github.com/jhugman/progenitor
 *
 * Copyright (c) 2012 jhugman
 * Licensed under the Apache license.
 */
"use strict";
var fs = require("fs"),
    _ = require("underscore");

exports.createProjectFromObject = function (templateDir, targetDir, options) {
	exports.createProject(templateDir, targetDir, function (key) {
		return options[key];
	});
};

var keyname = "([A-Za-z](?:[\\w]*?[A-Za-z0-9])?)";
function makeDetector(opener, closer) {
    var s = [];
    for (var i=0, max = opener.length; i<max;i++) {
        s.push("(?:" + opener[i] + keyname + closer[i] + ")")
    }
    return new RegExp(s.join("|"), "g");
}

function makeKeyFinder(opener, closer) {
    function joinRe(patterns) {
        return "(?:(?:" + patterns.join(")|(?:") + "))";
    }
    
    return new RegExp("^"+ joinRe(opener) + keyname + joinRe(closer) + "$");
}

var opener = ["__", "\\{\\{", "--", "xX"];
var closer = ["__", "\\}\\}", "--", "Xx"];
 
var reDetector =  makeDetector(opener, closer);

var reKeyFinder = makeKeyFinder(opener, closer);
var doReplacement = true;
var keysFound = [];

exports.createOptionSelector = function (options) {
	options = options || {};
	return function (key) {
	    var value = options[key];
	    if (_.isString(value)) {
	        return value;
	    }
		return process.env[key] || null;
	};
};


function textReplace(text, optionSelector) {
	optionSelector = optionSelector || function (k) { return null; };
	return text.replace(reDetector, function (variable) {
		var match = variable.match(reKeyFinder);
		if (!match) {
		    return variable;
		}
		var variableName = match[1];
		if (!variableName) {
		    return variable;
		}
		
		var initialValue = optionSelector(variableName);
		var retValue;
		if (_.isString(initialValue)) {
			retValue = textReplace(initialValue, optionSelector);
		} else {
			retValue = variable;
		}
		keysFound.push(variableName);
		return retValue;
	});	
}
exports.textReplace = textReplace;

function textReplaceFile(src, dest, optionSelector) {
    var template = src + ".template";
    if (fs.existsSync(template)) {
        src = template;
    }
	var text = fs.readFileSync(src).toString();
	var newText = textReplace(text, optionSelector);
	if (doReplacement) {
	    fs.writeFileSync(dest, newText);
	}
}

exports.template = function (src, dest, optionSelector) {
    if (_.isUndefined(optionSelector)) {
        optionSelector = dest;
        dest = null;
    }
    
    if (_.isObject(optionSelector)) {
        optionSelector = exports.createOptionSelector(optionSelector);
    } else if (!_.isFunction(optionSelector)) {
        throw new Error("Need either a function or an object as options");
    }
    
    if (!_.isString(src)) {
        throw new Error("Temlate acts on either a filepath or arbitrary string. The first arg must be a string");
    }
    
    if (!dest) {
        // we don't have any destination, but we have a string and an optionSelector 
        // so we do simple text replace.
        return textReplace(src, optionSelector);
    }
    
    if (fs.statSync(src).isDirectory()) {
        var suppressTopLevelDirectory = (fs.existsSync(dest) && fs.statSync(dest).isDirectory());
        exports.textReplaceFileTree(src, dest, optionSelector, suppressTopLevelDirectory);
    } else {
        textReplaceFile(src, dest, optionSelector);
    }
}

function textReplaceFilename(src, optionSelector) {
	return textReplace(src, optionSelector);
}



function textReplaceDirName(src, optionSelector) {
	var replaceDots = false;
	var newOptionSelector = function (key) {
		if (key.indexOf("JAVA_PACKAGE") >= 0) {
			replaceDots = true;
		}
		return optionSelector(key);
	};
	var value = textReplace(src, newOptionSelector);
	if (replaceDots) {
		value = value.replace(/\./g, "/");
	}
	return value;
}

var path = require("path");
function mkdirs (dirname) {
	if (fs.existsSync(dirname)) {
		return true;
	} else {
		mkdirs(path.dirname(dirname));
		fs.mkdirSync(dirname, "0755");
	}
}
exports.mkdirs = mkdirs;

exports.textReplaceFileTree = function textReplaceFileTree (src, destDir, optionSelector, suppressTopLevelDir) {
	var filename, dest;
	var info = fs.statSync(src);
    if (info.isDirectory()) {
    	filename = textReplaceDirName(path.basename(src), optionSelector);
    	if (!suppressTopLevelDir) {    	    
    	    dest = path.join(destDir, filename);
    	} else {
    	    dest = destDir;
    	}
    	if (doReplacement) {
    	    mkdirs(dest);
    	}
    	var files = fs.readdirSync(src);
    	var max=files.length;
    	for (var i=0; i<max; i++) {
    		textReplaceFileTree(path.join(src, files[i]), dest, optionSelector);
    	}
    	
    } else {
    	filename = textReplaceFilename(path.basename(src), optionSelector);
    	dest = path.join(destDir, filename);
    	textReplaceFile(src, dest, optionSelector);
    }
};

exports.collectKeys = function (src, options) {
    doReplacement = false;
    keysFound = [];
    var selector = exports.createOptionSelector(options || {});
    
    exports.textReplaceFileTree(src, '', selector);
    
    doReplacement = true;
    var unique = _.unique(keysFound);
    keysFound = [];
    return unique;
};
