#!/usr/bin/env node

var path = require("path"),
    fs = require("fs");

var templateDir = path.join(__dirname, "..", "templates");

function checkTemplateName (name) {
    function exists (filepath) {
        if (fs.existsSync) {
            return fs.existsSync(filepath);
        } else {
            return path.existsSync(filepath);
        }
    }
    var myTemplatePath = path.join(templateDir, name);
    if (exists(myTemplatePath)) {
        return myTemplatePath;
    } else {
        return null;
    }
}


function getExistingTemplateNames () {
    return fs.readdirSync(templateDir);
}

var argv = require('optimist')
    .usage('Usage: $0 {OPTIONS}')
    .wrap(80)
    .option('src', {
        alias : 's',
        desc : 'The source template directory\n'
            + 'This should contain an options.js file and a contents directory.'
        ,
    })
    .option('template', {
        alias: "t",
        desc: "The name of a template. This should exist in the templates directory"
    })
    .option('dest', {
        alias : 'd',
        desc : 'A destination directory\n'
            + ''
        ,
    })
    .option('generate', {
        alias: 'g',
        desc : 'Generate a prompt file of options',
        type : 'boolean'
    })
    .option('debug', {
        desc : 'Debug mode',
        type : 'boolean'
    })
    .option('verbose', {
        alias : 'v',
        desc : "I'll show my working."
    })
    .option('help', {
        alias : 'h',
        desc : 'Show this message'
    })
    .check(function (argv) {
        argv.verbose = argv.verbose || argv.debug;
        if (argv.template) {
            var templateDir = checkTemplateName(argv.template);
            if (!templateDir) {
                var templates = getExistingTemplateNames();
                templates.unshift("Ready made templates available are:");
                throw templates.join("\n * ");
            }
            argv.src = templateDir;
        }
        
        if (argv.help) throw '';
        if (!(argv.dest || argv.generate) && !argv.src) throw "You need to specify both a source and a target";
    })
    .argv;


var prompts = require("../lib/progenitor-prompts");


prompts.prompt(argv);
