var assert = require('assert');

module.exports = function parse(str) {
  var json = JSON.parse(str);
  assert(json.shift() === "MARKDOWN");
  var blocks = convertBlocks(json);
  return ['text'].concat(blocks);
};

var convertBlocks = function(blocks) {
  var result = [];

  blocks.forEach(function(block) {
    var type = block.shift();
    switch (type) {

      case 'PARA':
        result.push(['para', { 'level': 0 }].concat(convertInlines(block)));
        break;

    }
  });

  return result;
};

var convertInlines = function(inlines) {
  inlines = extractInlines(inlines);
  inlines = normalizeInlines(inlines);
  return inlines;
};

var extractInlines = function(inlines) {
  var result = [];

  inlines.forEach(function(inline) {
    var type = inline.shift();
    switch (type) {

      case 'STR':
        assert(inline.length === 1);
        result.push(['plain', inline[0]]);
        break;

      case 'SPACE':
        assert(inline.length === 1);
        result.push(['plain', ' ']);
        break;

    }
  });

  return result;
};

var normalizeInlines = function(inlines) {
  var result = [inlines.shift()];
  while (inlines.length > 0) {
    var current = inlines.shift();
    if (current[0] === 'break') {
      result.push(current);
      continue;
    }

    var last = result[result.length-1];
    if (last[0] == current[0] ||
        (current[0] === 'plain' && current[1] === ' ' &&
         inlines.length > 0 && last[0] === inlines[0][0] &&
         last[0] !== 'break')) {
      // append text
      assert(typeof last[1] === 'string');
      last[1] += current[1];
    } else {
     result.push(current);
    }
  }
  return result;
};
