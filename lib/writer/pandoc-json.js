var assert = require('assert');

module.exports = function formatText(text, options) {
  assert(text.shift() == 'text');
  var metadata = { "docTitle": [], "docAuthors": [], "docDate": [] };
  var links = extractLinks(text);
  var notes = extractNotes(text, links);
  var blocks = nestBlocks(text);
  blocks = convertBlocks(blocks, { links: links, notes: notes });
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

var extractLinks = function(blocks) {
  var links = {};
  blocks.forEach(function(block) {
    var type = block[0];
    if (type !== 'link')
      return;
    var spans = block.slice(2);
    if (spans.length < 2 || spans[0][0] !== 'linkref' || spans[1][0] !== 'url')
      return;
    var ref = spans[0][1];
    var url = spans[1][1];
    links[ref] = url;
  });
  return links;
};

var extractNotes = function(blocks, links) {
  var notes = {};
  blocks.forEach(function(block) {
    var type = block[0];
    if (type !== 'note')
      return;
    var spans = block.slice(2);
    if (spans.length < 1 || spans[0][0] !== 'noteref')
      return;
    var ref = spans[0][1];
    var para = ['para', {}].concat(spans.slice(1));
    notes[ref] = convertBlocks([para], { links: links, notes: notes });
  });
  return notes;
};

var convertBlocks = function(blocks, context) {
  var result = [];
  blocks.forEach(function (block) {    
    var type = block.shift();
    var attr = block.shift();

    switch (type) {
      case 'quote':
        var block = {'Para': convertInlines(block, context)};
        for (var i = 0 ; i <= attr.level; i++)
          block = { 'BlockQuote': [ block ] };
        result.push(block);
        break;
      case 'bulleted':
        result.push({'BulletList': convertList(block, context)});
        break;
      case 'numbered':
        result.push({'OrderedList': [[1, 'Decimal', 'Period'], convertList(block, context)]});
        break;
      case 'heading':
        var level = attr.level + 4;
        result.push({"Header":[level, convertInlines(block, context)]});
        break;
      case 'para':
        result.push({'Para': convertInlines(block, context)});
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
    }
  });
  return result;
};

var convertList = function(items, context) {
  var result = [];
  items.forEach(function (item) {
    var blocks = convertBlocks(item, context);
    result.push(blocks);
  });
  return result;
};

var convertInlines = function(inlines, context) {
  var result = [];
  inlines.forEach(function (inline, index) {
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
      case 'url':
        result.push({"Link":[[{"Code":[["",["url"],[]], text]}], [text,""]]});
        break;
      case 'noteref':
        if (context.notes[text]) {
          result.push({"Note": context.notes[text]});
        }
        break;
      case 'linktext':
        if (index + 1 < inlines.length && inlines[index+1][0] === 'linkref') {
          var ref = inlines[index+1][1];
          result.push({"Link":[ convertString(text), [ context.links[ref], ""]]});
        }
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
