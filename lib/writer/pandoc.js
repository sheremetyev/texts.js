var assert = require('assert');

module.exports = function formatText(text, options) {
  assert(text.shift() == 'text');
  var metadata = { "docTitle": [], "docAuthors": [], "docDate": [] };
  var blocks = nestBlocks(text);
  blocks = convertBlocks(blocks);
  return JSON.stringify([metadata, blocks], null, 2);
};

var nestBlocks = function(blocks) {
  var result = [];
  var levels = [result];
  var lists = [];

  blocks.forEach(function(block) {
    var type = block[0];
    var level = block[1].level;

    // close nested lists
    while (lists.length > level+1 && lists.length > 0) {
      lists.pop();
      levels.pop();
      levels.pop();
    }

    // junction of bulleted and numbered lists or vice versa → close last level
    if (lists.length > 0 && lists.length === level+1 &&
        lists[lists.length-1] !== type) {
      lists.pop();
      levels.pop();
      levels.pop();
    }

    // start lists if necessary
    if (type === 'bulleted' || type === 'numbered') {
      while (lists.length < level+1) {
        lists.push(type);

        var item = [];
        var list = [type, {}, item];
        levels[levels.length-1].push(list);

        levels.push(list);
        levels.push(item);
      }

      var item = levels[levels.length-1];

      if (item.length > 0) {
        levels.pop();
        item = [];
        levels[levels.length-1].push(item);
        levels.push(item);
      }

      item.push(['para', {}].concat(block.slice(2)));
    } else {
      levels[levels.length-1].push(block);
    }
  });

  return result;
};

var convertBlocks = function(blocks) {
  var result = [];
  blocks.forEach(function (block) {    
    var type = block.shift();
    var attr = block.shift();

    switch (type) {
      case 'bulleted':
        result.push({'BulletList': convertList(block)});
        break;
      case 'para':
        result.push({'Para': convertInlines(block)});
        break;
    };
  });
  return result;
};

var convertList = function(items) {
  var result = [];
  items.forEach(function (item) {
    var blocks = convertBlocks(item);
    result.push(blocks);
  });
  return result;
};

var convertInlines = function(inlines) {
  // TODO: split words, translate styles
  return [{'Str': inlines[0][1]}];
};
