var assert = require('assert');

module.exports = function parse(str) {
  var json = JSON.parse(str);
  assert(json.shift() === "MARKDOWN");
  var context = { notesCounter: 0 };
  var blocks = convertBlocks(json, 0, context);
  return ['text'].concat(blocks);
};

var convertBlocks = function(blocks, level, context) {
  var result = [];

  blocks.forEach(function(block) {
    var type = block.shift();
    switch (type) {

      case 'PARA':
      case 'PLAIN':
      case 'TERM':
        result = result.concat(convertInlines(block, level, context));
        break;

      case 'H1':
      case 'H2':
      case 'H3':
      case 'H4':
      case 'H5':
      case 'H6':
        var headingLevel = parseInt(type.substr(1)) - 4;
        headingLevel = headingLevel > -1 ? -1 : headingLevel;
        var convertedBlocks = convertInlines(block, level, context);
        assert(convertedBlocks.length > 0);
        convertedBlocks[0][0] = 'heading';
        convertedBlocks[0][1].level = headingLevel;
        result = result.concat(convertedBlocks);
        break;

      case 'BLOCKQUOTE':
        var quotes = convertBlocks(block, level+1, context);
        quotes.forEach(function(block) {
          if (block[0] !== 'quote') {
            block[0] = 'quote';
            block[1].level--;
          }
        });
        result = result.concat(quotes);
        break;

      case 'BULLETLIST':
        result = result.concat(convertList('bulleted', block, level, context));
        break;

      case 'ORDEREDLIST':
        result = result.concat(convertList('numbered', block, level, context));
        break;

      case 'DEFINITION':
        var definitionBlocks = convertBlocks(block, level+1, context);
        assert(definitionBlocks.length > 0);
        definitionBlocks[0][0] = 'bulleted';
        definitionBlocks[0][1].level = level;
        result = result.concat(definitionBlocks);
        break;

      case 'IMAGEBLOCK':
        var attr = block.shift();
        var url = attr["URL"];
        result.push(['image', { 'level': level }, ['url', url] ]);
        break;

      case 'VERBATIM':
        assert(block.length === 1);
        var inlines = convertVerbatim(block[0]);
        result.push(['verbatim', { 'level': level }].concat(inlines));
        break;

      case 'LIST':
      case 'DEFLIST':
      case 'HEADINGSECTION':
        result = result.concat(convertBlocks(block, level, context));
        break;

      default: // extract just text in the worst case
        result = result.concat(convertInlines(block, level, context));
    }
  });

  return result;
};

var convertList = function(listType, items, level, context) {
  var result = [];

  items.forEach(function(item) {
    assert(item.shift() === 'LISTITEM');
    var blocks = convertBlocks(item, level+1, context);
    assert(blocks.length > 0);
    blocks[0][0] = listType;
    blocks[0][1].level = level;
    result = result.concat(blocks);
  });

  return result;
};

var convertInlines = function(inlines, level, context) {
  var notes = [];
  inlines = extractInlines(inlines, context, notes);
  var blocks = separateImages(inlines, level);
  blocks = normalizeBlocks(blocks);
  return blocks.concat(notes);
};

var extractInlines = function(inlines, context, notes) {
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

      case 'LINEBREAK':
        result.push(['break', '\n']);
        break;

      case 'SINGLEQUOTED':
        result.push(['plain', '‘']);
        result = result.concat(extractInlines(inline, context, notes));
        result.push(['plain', '’']);
        break;

      case 'DOUBLEQUOTED':
        result.push(['plain', '“']);
        result = result.concat(extractInlines(inline, context, notes));
        result.push(['plain', '”']);
        break;

      case 'ENDASH':
        result.push(['plain', '–']);
        break;

      case 'EMDASH':
        result.push(['plain', '—']);
        break;

      case 'APOSTROPHE':
        result.push(['plain', '’']);
        break;

      case 'ELLIPSIS':
        result.push(['plain', '…']);
        break;

      case 'EMPH':
        var innerInlines = extractInlines(inline, context, notes);
        overrideInlineStyle(innerInlines, 'emph');
        result = result.concat(innerInlines);
        break;

      case 'STRONG':
        var innerInlines = extractInlines(inline, context, notes);
        overrideInlineStyle(innerInlines, 'strong');
        result = result.concat(innerInlines);
        break;

      case 'CODE':
        assert(inline.length === 1);
        result.push(['code', inline[0]]);
        break;

      case 'NOTE':
        var noteRef = (++(context.notesCounter)).toString();
        result.push(['noteref', noteRef]);
        var noteBlocks = convertBlocks(inline, 0, context);
        assert(noteBlocks.length > 0);
        noteBlocks[0][0] = 'note';
        noteBlocks[0].splice(2, 0, ['noteref', noteRef]);
        noteBlocks.forEach(function(b) { notes.push(b); });
        break;

      case 'LINK':
        var attr = inline.shift();
        var url = attr["URL"];
        assert(inline.length > 0);
        if (inline.length === 1 && inline[0][0] === "STR" && inline[0][1] === url) {
          // literal URL
          result.push(['url', url]);
          break;
        }
        var linkRef = (++(context.notesCounter)).toString();
        var linkInlines = extractInlines(inline, context, notes);
        var linkText = inlinesToLinkText(linkInlines);
        result.push(linkText);
        result.push(['linkref', linkRef]);
        notes.push(['link', { 'level': 0 }, ['linkref', linkRef], ['url', url] ]);
        break;

      case 'IMAGE':
        var attr = inline.shift();
        var url = attr["URL"];
        // image block will be extracted from inlines at later stage
        result.push(['image', { 'level': 0 }, ['url', url] ]);
        break;

      case 'LIST':
        result = result.concat(extractInlines(inline, context, notes));
        break;

      default: // extract just text in the worst case
        if (inline.length === 1 && typeof inline[0] == 'string')
          result.push(['plain', inline[0]]);
        else
          result = result.concat(extractInlines(inline, context, notes));
    }
  });

  return result;
};

var separateImages = function(inlines, level) {
  var result = [];
  var current = [];
  inlines.forEach(function (inline) {
    switch (inline[0]) {
      case 'image':
        if (current.length > 0)
          result.push(['para', { 'level': level }].concat(current));
        current = [];
        result.push(inline);
        break;
      default:
        current.push(inline);
    }
  });
  if (current.length > 0)
    result.push(['para', { 'level': level }].concat(current));
  return result;
};

var normalizeBlocks = function(blocks) {
  var result = [];
  blocks.forEach(function(block) {
    var head = [block.shift(), block.shift()];
    var inlines = normalizeInlines(block);
    result.push(head.concat(inlines));
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

var inlinesToLinkText = function(inlines) {
  var text = "";
  inlines.forEach(function(inline) {
    switch (inline[0]) {
      case 'image':
      case 'break':
        return;
    }
    assert(typeof inline[1] === 'string');
    text += inline[1];
  });
  return ['linktext', text];
};

var overrideInlineStyle = function(inlines, style) {
  inlines.forEach(function (inline) {
    if (inline[0] === 'plain')
      inline[0] = style;
  });
};

var convertVerbatim = function(str) {
  var lines = str.split('\n');

  // trim empty lines at the beginning and at the end
  while (lines.length > 0 && lines[0].length === 0) {
    lines.splice(0, 1);
  }
  while (lines.length > 0 && lines[lines.length-1].length === 0) {
    lines.splice(lines.length-1, 1);
  }

  var inlines = [];
  lines.forEach(function (line) {
    if (inlines.length > 0)
      inlines.push(['break', '\n']);
    inlines.push(['plain', line]);
  });
  return inlines;
};
