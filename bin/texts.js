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

// option parsing completed

var fs = require('fs');
var texts = require('../lib/texts.js')

var options = {
  standalone:   parsed.standalone,
  wrap:         parsed.wrap,
  pandoc:       parsed.pandoc,
};

var translator = texts(parsed.from, parsed.to, options);
translator.pipe(process.stdout);

if (parsed.argv.remain.length) {
  // process files
  parsed.argv.remain.forEach(function(inputFile) {
    fs.createReadStream(inputFile).pipe(translator);
  });
} else {
  // process stdin
  process.stdin.pipe(translator);
}
