#!/usr/bin/env node

var fs = require('fs');
var walkdir = require('walkdir');
var parseText = require('../../lib/reader/text');

var files = walkdir.sync(__dirname + '/Tests/');
files = files.filter(function(file) { return file.substr(-5) === '.text' });
files = files.filter(function(file) { return fs.statSync(file).isFile(); });

files.forEach(function (file) {
  console.log(file);
  var text = fs.readFileSync(file, 'utf8');
  var json = parseText(text);
});
