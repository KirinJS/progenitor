var progenitor = require('../lib/progenitor.js');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/


exports.createOptionSelector = {
	setUp: function (done) {
		done();
	},
	
	'no args': function(test) {
	    test.expect(3);
	    // tests here
	    var optionSelector = progenitor.createOptionSelector();
	    test.equal(typeof optionSelector, 'function');
	    
	    // falls through to process.env
	    test.equal(optionSelector("HOME"), process.env["HOME"]);
	    test.equal(optionSelector("NOT THERE"), null);
	    test.done();
	},
	
	'object arg': function (test) {
		test.expect(4);
		
		var options = {"one": "abc", "two": "def"};
		
		var optionSelector = progenitor.createOptionSelector(options);
	    test.equal(typeof optionSelector, 'function');
	    
	    // falls through to process.env
	    test.equal(optionSelector("one"), options.one);
	    test.equal(optionSelector("two"), options.two);
	    test.equal(optionSelector("HOME"), process.env["HOME"]);
	    
	    test.done();
	}
	
	
};

exports.textReplacement = {
	setUp: function (done) {
		done();
	},
	
	simpleReplacement: function (test) {
		var options = {"FOO": "cat", "BAR": "fish"};
		var optionSelector = progenitor.createOptionSelector(options);
		test.expect(3);
		
		test.equal(progenitor.textReplace("My __FOO__ loves __BAR__", optionSelector), 
				"My cat loves fish");
		test.equal(progenitor.textReplace("My __FOO__ hates __CHEESE__", optionSelector), 
				"My cat hates __CHEESE__");	
		test.equal(progenitor.textReplace("___FOO___", optionSelector), "_cat_");
		
		test.done();
	},
	
	recursiveReplacement: function (test) {
		var options = {"FOO": "cat", "BAR": "my __FOO__'s mum"};
		var optionSelector = progenitor.createOptionSelector(options);
		
		test.expect(1);
		var s = "My __FOO__ loves __BAR__";
		
		test.equal(progenitor.textReplace(s, optionSelector), "My cat loves my cat's mum");
		
		test.done();
	},
	
	multipleDelimeters: function (test) {
	    var options = {"FOO": "cat", "BAR": "fish"};
        var optionSelector = progenitor.createOptionSelector(options);
        test.expect(7);
	    
        test.equal(progenitor.textReplace("My {{FOO}} loves {{BAR}}", optionSelector), 
            "My cat loves fish");
        test.equal(progenitor.textReplace("My xXFOOXx loves xXBARXx", optionSelector), 
            "My cat loves fish");
        test.equal(progenitor.textReplace("My --FOO-- loves --BAR--", optionSelector), 
            "My cat loves fish");
        test.equal(progenitor.textReplace("My --FOO-- hates --CHEESE--", optionSelector), 
            "My cat hates --CHEESE--"); 
        test.equal(progenitor.textReplace("{{{FOO}}}", optionSelector), "{cat}");
        test.equal(progenitor.textReplace("---FOO---", optionSelector), "-cat-");
        test.equal(progenitor.textReplace("xxXFOOXxx", optionSelector), "xcatx");
        
	    test.done();
	},
	
	emptyString: function (test) {
	    test.expect(2);
        
        var options = { empty: "" };
        var optionSelector = progenitor.createOptionSelector(options);
        
        test.equal(progenitor.textReplace("__empty__", optionSelector), "");
        test.equal(progenitor.textReplace("__undefined__", optionSelector), "__undefined__");
        
        test.done();
	},
	
	bugFix: function (test) {
	    test.expect(1);
	    
	    var options = {
	            "shortName": "mynewapp", 
	            "contextPackage": "__companyIdentifier__xXJAVA_PACKAGEXx",
	            "JAVA_PACKAGE": "",
	            "companyIdentifier": "com.example"
	    };
        var optionSelector = progenitor.createOptionSelector(options);
        test.expect(2);
        
        
        
        test.equal(progenitor.textReplace("xXcontextPackageXx.xXshortNameXx", optionSelector), 
        "com.example.mynewapp");
        test.equal(progenitor.textReplace("__companyIdentifier__{{JAVA_PACKAGE}}.mynewapp", optionSelector), 
            "com.example.mynewapp");
	    
	    test.done();
	}
};

var path = require("path"),
	fs = require("fs");
exports.textReplaceForAFileStructures = {
	setUp: function (done) {
		done();
	},
	
	simpleFile: function (test) {
		var options = {
			animal: "cat", 
			thing: "mat",
			verb: "make eye contact",
			filename: "template_file"
		}
		
		var optionSelector = progenitor.createOptionSelector(options);
		progenitor.textReplaceFileTree(path.join(__dirname, "dummies/simple_tests/sample_file.txt"), "/tmp/", optionSelector);
		
		test.expect(4);
		var newText = fs.readFileSync("/tmp/sample_file.txt").toString();
		test.ok(newText.indexOf("The cat sat on the mat") >= 0);
		test.ok(newText.indexOf("It didn't make eye contact") >= 0);
		
		progenitor.textReplaceFileTree(path.join(__dirname, "dummies/simple_tests/sample___filename__.txt"), "/tmp/", optionSelector);
		newText = fs.readFileSync("/tmp/sample_template_file.txt").toString();
		test.ok(newText.indexOf("The cat was about to make eye contact.") >= 0);
		test.ok(newText.indexOf("Sadly, it fell off the mat") >= 0);
		
		test.done();
	},
	
	simpleDir: function (test) {
		var options = {
			animal: "dog", 
			thing: "step",
			verb: "smile",
			filename: "template_file"
		};
		var optionSelector = progenitor.createOptionSelector(options);
		
		progenitor.textReplaceFileTree(path.join(__dirname, "dummies/simple_tests"), "/tmp/progenitor_test", optionSelector);
		
		
		
		test.done();
	}, 
	
	javaDir: function (test) {
		var options = {
			project: "MyProject",
			JAVA_PACKAGE: "com.example.myproject"
		};
		var optionSelector = progenitor.createOptionSelector(options);
		
		progenitor.textReplaceFileTree(path.join(__dirname, "dummies/java_packages"), "/tmp/progenitor_test", optionSelector);
		
		test.done();
		
	}
		
}