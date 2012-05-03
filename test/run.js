var mocha = require('mocha');
var expect = require('chai').expect;

var suite = loadTests();
var runner = new mocha.Runner(suite);
var reporter = new mocha.reporters.List(runner);
runner.run();

function loadTests(mainSuite) {
  var fs = require('fs');
  
  var mainSuite = new mocha.Suite('', new mocha.Context);
  
  fs.readdirSync(__dirname).forEach(function(testdirname) {
    var testdir = __dirname + '/' + testdirname;
    if (fs.statSync(testdir).isDirectory()) {
  
      var suite = new mocha.Suite.create(mainSuite, testdirname);
      fs.readdirSync(testdir).forEach(function(testfilename) {
        if (testfilename.substr(-5) === '.test') {
          
          var testfile = testdir + '/' + testfilename;
          var testname = testfilename.slice(0, -5);

          var test = new mocha.Test(testname, function(done) {
            runTestFile(testfile, done);
          });
          
          suite.addTest(test);
        }
      });
    }
  });

  return mainSuite;
}

function runTestFile(filename, done) {
  var test = require('fs').readFileSync(filename, 'utf8').replace(/\r\n/g,'\n');

  var match = /^(.*)\n<<<\n([\s\S]*)>>>\n([\s\S]*)$/.exec(test);
  var command = match[1];
  var input   = match[2];
  var output  = match[3];

  var dir = require('path').dirname(filename);
  
  require('child_process').exec(command, { cwd: dir },
    function (error, stdout, stderr) {
      if (error !== null) {
        done(error);
      } else {
        expect(stdout).to.eql(output);
        done();
      }
    }
  ).stdin.end(input);
};
