#!/usr/bin/env node

var path = require("path"),
    fs = require("fs");



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
    .option('templates', {
        desc: "The path to the templates directory"
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
        if (argv.help) throw '';
        argv.verbose = argv.verbose || argv.debug;
        if (!(argv.src || argv.template)) {
            throw "You need to specify either the name of a template (using -t) or the path to a template (using -s <path>)";
        }
        
        if (!(argv.dest || argv.generate)) throw "You need to specify either a destination where the new project will be (using -d)";
    })
    .argv;


var prompts = require("../lib/progenitor-prompts");


prompts.prompt(argv);
