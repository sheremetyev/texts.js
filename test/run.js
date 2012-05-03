var fs = require('fs');

fs.readdirSync(__dirname).forEach(function(testdirname) {
  var testdir = __dirname + '/' + testdirname;
  if (fs.statSync(testdir).isDirectory()) {
    console.log('Running tests in ' + testdirname);
    fs.readdirSync(testdir).forEach(function(testfilename) {
      var testfile = testdir + '/' + testfilename;
      if (testfile.substr(-5) === '.test') {
        console.log('* ' + testfilename);
        runTestFile(testfile);
      }
    });
  }
});

function runTestFile(filename) {
  var test = fs.readFileSync(filename, 'utf8').replace(/\r\n/g,'\n');

  var match = /^(.*)\n<<<\n([\s\S]*)>>>\n([\s\S]*)$/.exec(test);
  var options = match[1];
  var input   = match[2];
  var output  = match[3];

  var command = 'node ' + __dirname + '/../bin/texts-cli.js ' + options;
  require('child_process').exec(command,
    function (error, stdout, stderr) {
      if (error !== null) {
        console.log('ERROR: ' + error);
        console.log('STDERR:\n' + stderr);
      } else {
        compare(output, stdout);
      }
    }
  ).stdin.end(input);
};

function compare(expected, actual) {
  require('assert').equal(actual, expected);
}  
