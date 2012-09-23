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
      case 'numbered':
        result.push({'OrderedList': [[1, 'Decimal', 'Period'], convertList(block)]});
        break;
      case 'para':
        result.push({'Para': convertInlines(block)});
        break;
      case 'formula':
        result.push({'Para': [{'Math': ['DisplayMath', '\n' + verbatimInlines(block) + '\n']} ]});
        break;
      case 'verbatim':
        result.push({'CodeBlock': [['',[],[]], verbatimInlines(block)]});
        break;
      case 'image':
        result.push({"Para": [{"Image": [[], [getImageUrl(block), ""]] }]});
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
  var result = [];
  inlines.forEach(function (inline) {
    var type = inline[0];
    var text = inline[1];
    switch (type) {
      case 'break':
        result.push('LineBreak');
        break;
      case 'plain':
        result = result.concat(convertString(text));
        break;
      case 'emph':
        result.push({'Emph': convertString(text)});
        break;
      case 'strong':
        result.push({'Strong': convertString(text)});
        break;
      case 'code':
        result.push({'Code': [ ['',[],[]], text] });
        break;
      case 'math':
        result.push({'Math': ['InlineMath', text]});
        break;
    }
  });
  return result;
};

var convertString = function(str) {
  return [{'Str': str}];
};

var verbatimInlines = function(inlines) {
  return inlines.map(function(inline) {
    return inline[1];
  }).join('');
};

var getImageUrl = function(spans) {
  if (spans.length > 0 && spans[0][0] === 'url')
    return spans[0][1];
  return "";
};
