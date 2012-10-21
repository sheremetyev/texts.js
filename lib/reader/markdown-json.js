var assert = require('assert');

module.exports = function parse(str) {
  var json = JSON.parse(str);
  assert(json.shift() === "MARKDOWN");
  var blocks = convertBlocks(json, 0);
  return ['text'].concat(blocks);
};

var convertBlocks = function(blocks, level) {
  var result = [];

  blocks.forEach(function(block) {
    var type = block.shift();
    switch (type) {

      case 'PARA':
      case 'PLAIN':
        result.push(['para', { 'level': level }].concat(convertInlines(block)));
        break;

      case 'H1':
      case 'H2':
      case 'H3':
      case 'H4':
      case 'H5':
      case 'H6':
        var headingLevel = parseInt(type.substr(1)) - 4;
        headingLevel = headingLevel > -1 ? -1 : headingLevel;
        result.push(['heading', { 'level': headingLevel }].concat(convertInlines(block)));
        break;

      case 'BULLETLIST':
        result = result.concat(convertList(block, level));
        break;

      case 'HEADINGSECTION':
        result = result.concat(convertBlocks(block, level));
        break;

      default: // extract just text in the worst case
        result.push(['para', { 'level': level }].concat(convertInlines(block)));
    }
  });

  return result;
};

var convertList = function(items, level) {
  var result = [];

  items.forEach(function(item) {
    assert(item.shift() === 'LISTITEM');
    assert(item.length === 1);
    item = item[0];
    assert(item.shift() === 'LIST');
    assert(item.length > 0);
    var blocks = convertBlocks(item, level+1);
    assert(blocks.length > 0);
    blocks[0][0] = 'bulleted';
    blocks[0][1].level = level;
    result = result.concat(blocks);
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
    if (! Array.isArray(inline)) // ignore objects, e.g. { "URL": "something" }
      return;

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

      default: // extract just text in the worst case
        if (inline.length === 1 && typeof inline[0] == 'string')
          result.push(['plain', inline[0]]);
        else
          result = result.concat(extractInlines(inline));
    }
  });

  return result;
};

var normalizeInlines = function(inlines) {
  if (inlines.length === 0)
    return [];

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
