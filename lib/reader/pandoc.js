var assert = require('assert');

module.exports = function parse(str) {
  var json = JSON.parse(str);
  var pandocBlocks = json[1];
  var blocks = convertBlocks(pandocBlocks, 0);
  return ['text'].concat(blocks);
};

var convertBlocks = function (pandocBlocks, level) {
  var blocks = [];
  pandocBlocks.forEach(function (block) {
    block = objectToArray(block);
    var type = block[0];
    var value = block[1];
    switch (type) {
      case 'Header':
        // Header Int [Inline] -- Header - level (integer) and text (inlines)
        var headingLevel = value[0];
        headingLevel -= 4;
        var inlines = convertInlines(value[1]);
        blocks.push(['heading', { 'level': headingLevel }].concat(inlines));
        break;
      case 'Para':
        // Para [Inline] -- Paragraph
        var inlines = convertInlines(value);
        blocks.push(['para', { 'level': level }].concat(inlines));
        break;
      case 'CodeBlock':
        // CodeBlock Attr String -- Code block (literal) with attributes
        var inlines = convertVerbatim(value[1]);
        blocks.push(['verbatim', { 'level': level }].concat(inlines));
        break;
    }
  });
  return blocks;
};

var convertInlines = function (pandocInlines) {
  var inlines = [];
  var current = "";
  pandocInlines.forEach(function(inline) {
    inline = objectToArray(inline);
    var type = inline[0];
    var value = inline[1];
    switch (type) {
      case 'Space':
        // Space -- Inter-word space
        current += ' ';
        break;
      case 'Str':
        // Str String -- Text (string)
        current += value;
        break;
    }
  });
  inlines.push(['plain', current]);
  return inlines;
};

var convertVerbatim = function(pandocString) {
  var lines = pandocString.split('\n');
  var inlines = [];
  lines.forEach(function (line) {
    if (inlines.length > 0)
      inlines.push(['break', '\n']);
    inlines.push(['plain', line]);
  });
  return inlines;
};

var objectToArray = function(obj) {
  // Pandoc's JSON is build by translating Haskell data structures and thus
  // is a bit inconveniet for processing. It contains objects with single
  // property where property name denotes object type, e.g. { "Str": "text" }.
  // We translate it into a two-element array like ["Str", "text"].
  // When object is just a string the second element is null.
  
  if (typeof obj == 'string')
    return [obj, null];

  var keys = Object.keys(obj);
  assert(keys.length == 1);
  var key = keys[0];
  return [key, obj[key]];
};
