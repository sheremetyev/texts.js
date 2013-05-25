var assert = require('assert');

module.exports = function formatText(text, options) {
  var json = formatJson(text, options);
  return JSON.stringify(json, null, 2);
};

var formatJson = module.exports.formatJson = function(text, options) {
  assert(text.shift() === 'text');

  var context = { footnotes: [] };
  context.links = extractLinks(text);
  context.notes = extractNotes(text, context);

  var nested = nestBlocks(text);

  var jsonml = nested.map(function(block) {
    return convertBlock(block, context);
  }).filter(function(elem) { return elem !== null; });

  if (context.footnotes.length > 0) {
    jsonml.push(['ol', { 'class': 'footnotes' }].concat(context.footnotes));
  }

  return jsonml;
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
    if (type === 'bulleted' || type === 'numbered' ||
        type === 'row' || type === 'col') {
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

var convertBlock = function(block, context) {
  var type = block.shift();
  var attr = block.shift();

  switch (type) {
    case 'link':     return null;
    case 'note':     return null;
    case 'verbatim': return ['pre', ['code', convertVerbatimSpans(block) + '\n']];
    case 'formula':  return ['figure', ['p', '\\[\n' + convertVerbatimSpans(block) + '\n\\]']];
    case 'image':    return convertImage(block);
    case 'divider':  return ['hr'];
    case 'bulleted': return ['ul'].concat(convertList(block, context));
    case 'numbered': return ['ol'].concat(convertList(block, context));
    case 'row':      return ['table'].concat(convertTable(block, context));
    case 'comment':  return null; // TODO: export as HTML comments?
  }

  var spans = convertSpans(block, context);

  switch (type) {

    case 'heading':
      switch (attr.level) {
        case -3: return ['h1'].concat(spans);
        case -2: return ['h2'].concat(spans);
        default: return ['h3'].concat(spans);
      }

    case 'quote': return ['blockquote', ['p'].concat(spans)];

    default:
      if (spans.length === 0)
        return null;
      else
        return ['p'].concat(spans);

  }
};

var convertList = function(items, context) {
  var result = [];
  items.forEach(function (item) {
    var blocks = item.map(function(block) {
      return convertBlock(block, context);
    }).filter(function(block) { return block !== null; });
    result.push(['li'].concat(blocks));
  });
  return result;
};

var convertVerbatimSpans = function(spans) {
  return spans.map(function formatVerbatimSpan(span, index) {
    var type = span.shift();
    var text = span.shift();
    assert(span.length === 0);
    assert(type === 'plain' || type === 'break');
    return text;
  }).join('');  
};

var convertImage = function(spans) {
  if (spans.length > 0 && spans[0][0] === 'url') {
    var url = spans[0][1];
    return ['figure', ['img', { 'src': url }]];
  }
  return null;
};

var convertSpans = function(spans, context) {
  return spans.map(function formatSpan(span, index) {
    var type = span.shift();
    var text = span.shift();
    assert(span.length === 0);

    switch (type) {
      case 'emph':   return ['em', text];
      case 'strong': return ['strong', text];
      case 'code':   return ['code', text];
      case 'url':    return ['a', { 'href' : text }, text];
      case 'break':  return ['br'];
      case 'math':   return '\\(' + text + '\\)';

      case 'linktext':
        if (index + 1 >= spans.length || spans[index+1][0] !== 'linkref')
          return text;
        var ref = spans[index+1][1];
        if (!context.links[ref])
          return text;
        return ['a', { 'href' : context.links[ref] }, text];
      case 'linkref': return null;

      case 'noteref':
        var id = (context.footnotes.length+1).toString();
        var footnote = context.notes[text];
        if (!footnote) {
          // footnote may be undefined
          return null;
        }
        // TODO: avoid second backlick when note is used multiple times
        footnote.push(['a', { 'href': '#fnref:'+id, 'rev': 'footnote' }, '↩']);
        context.footnotes.push(['li', { 'id': 'fn:'+id }, footnote]);
        return ['sup', { 'id': 'fnref:'+id },
          ['a', { 'href': '#fn:'+id, 'rel': 'footnote' }, id]
        ];

      default: return text;
    }
  }).filter(function(span) { return span !== null; });
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

var extractNotes = function(blocks, context) {
  var notes = {};
  blocks.forEach(function(block) {
    var type = block[0];
    if (type !== 'note')
      return;
    var spans = block.slice(2);
    if (spans.length < 1 || spans[0][0] !== 'noteref')
      return;
    var ref = spans[0][1];
    notes[ref] = ['p'].concat(convertSpans(spans.slice(1), context));
  });
  return notes;
};

var convertTable = function(items, context) {
  items = items[0][0].slice(2);
  var rows = [];
  items.forEach(function (item) {
    var row = [['td', convertBlock(item[0], context)]];
    var cols = item[1].slice(2);
    cols.forEach(function (col) {
      row.push(['td', convertBlock(col[0], context)]);
    });
    rows.push(['tr'].concat(row));
  });

  return rows;
};
