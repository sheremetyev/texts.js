var assert = require('assert');

module.exports = function formatText(text, options) {
  var json = formatJson(text, options);
  return JSON.stringify(json, null, 2);
};

var formatJson = module.exports.formatJson = function(text, options) {
  assert(text.shift() === 'text');
  var jsonml = text.map(convertBlock);
  return jsonml;
};

var convertBlock = function(block) {
  var type = block.shift();
  var attr = block.shift();

  var spans = block.map(convertSpan);

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

var convertSpan = function(span) {
  var type = span.shift();
  var text = span.shift();
  assert(span.length === 0);

  switch (type) {
    case 'emph':   return ['em', text];
    case 'strong': return ['strong', text];
    case 'code':   return ['code', text];
    case 'url':    return ['a', { 'href' : text }, text];
    case 'break':  return ['br'];
    default:       return text;
  }
};
