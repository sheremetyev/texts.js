#!/usr/bin/env node

var nopt = require('nopt');
var options = {
  'help': Boolean,
  'from' : [ 'json', 'text', 'pandoc-json', 'markdown-json' ],
  'to' :   [ 'json', 'text', 'pandoc-json', 'xelatex', 'jsonml', 'html5' ],
  'pandoc': String,
  'standalone' : Boolean,
  'wrap' : Boolean,
};
var shorthands = {
  'h' : '--help',
  'f' : '--from',
  't' : '--to',
  's' : '--standalone',
};
var parsed = nopt(options, shorthands);

if (parsed.help || !parsed.from || !parsed.to) {
  console.log([
    'Usage: texts [OPTIONS] [FILES]',
    '',
    'Options:',
    '  -f FORMAT             --from=FORMAT',
    '  -t FORMAT             --to=FORMAT',
    '  -s                    --standalone',
    '                        --no-wrap',
    '  -h                    --help',
  ].join('\n'));
  process.exit(1);
}

parsed.standalone = parsed.standalone || false;
parsed.wrap = (typeof parsed.wrap !== 'undefined') ? parsed.wrap : true;
parsed.pandoc = (parsed.pandoc || '1.10').split('.');

var writerOptions = { standalone: parsed.standalone, wrap: parsed.wrap, pandoc: parsed.pandoc };

// option parsing completed

var fs = require('fs');
var reader = require('../lib/reader/' + parsed.from);
var writer = require('../lib/writer/' + parsed.to);

function readInput(cb) {
  var input = [];
  process.stdin.on('data', function(data) { input.push(data); });
  process.stdin.on('end', function() { cb(null, input.join('')); });
  process.stdin.setEncoding('utf8');
  process.stdin.resume();
}

function writeOutput(str) {
  process.stdout.write(str);
}

if (parsed.argv.remain.length) {
  // process files
  parsed.argv.remain.forEach(function(inputFile) {
    var input = fs.readFileSync(inputFile, 'utf8');
    var text = reader(input);
    var output = writer(text, writerOptions);
    writeOutput(output);
  });
} else {
  // process stdin
  readInput(function (err, input) {
    var text = reader(input);
    var output = writer(text, writerOptions);
    writeOutput(output);
  });
}
