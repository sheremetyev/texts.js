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

  var jsonml = text.map(function(block) {
    return convertBlock(block, context);
  }).filter(function(elem) { return elem !== null; });

  if (context.footnotes.length > 0) {
    jsonml.push(['ol', { 'class': 'footnotes' }].concat(context.footnotes));
  }

  return jsonml;
};

var convertBlock = function(block, context) {
  var type = block.shift();
  var attr = block.shift();

  switch (type) {
    case 'link':     return null;
    case 'note':     return null;
    case 'verbatim': return ['pre', ['code', convertVerbatimSpans(block) + '\n']];
    case 'image':    return convertImage(block);
  }

  var spans = convertSpans(block, context);

  switch (type) {

    case 'heading':
      switch (attr.level) {
        case -3: return ['h1'].concat(spans);
        case -2: return ['h2'].concat(spans);
        default: return ['h3'].concat(spans);
      }

    default: return ['p'].concat(spans);

  }
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

      case 'linktext':
        if (index + 1 < spans.length && spans[index+1][0] === 'linkref') {
          var ref = spans[index+1][1];
          return ['a', { 'href' : context.links[ref] }, text];
        }
        return null;
        break;
      case 'linkref': return null;

      case 'noteref':
        var id = (context.footnotes.length+1).toString();
        var footnote = context.notes[text];
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
