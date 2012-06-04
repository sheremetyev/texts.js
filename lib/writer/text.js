var assert = require('assert');

module.exports = function formatText(text, options) {
  assert(text.shift() == 'text');

  var result = [];
  text.forEach(function(block) {
    result.push(formatBlock(block));
  });

  var output = result.join('\n\n') + '\n';
  return output;
};

function formatBlock(block) {
  var type = block.shift();
  var attr = block.shift();

  var spans = [];
  block.forEach(function(span) {
    spans.push(formatSpan(span));
  });
  var text = spans.join('');

  switch (type) {
    case 'heading': return formatHeading(text, attr.level);
    default: return text;
  };
};

function formatHeading(text, level) {
  switch (level) {
    case 1: return text + '\n' + new Array(text.length+1).join('=');
    case 2: return text + '\n' + new Array(text.length+1).join('-');
    default: return new Array(level+1).join('#') + ' ' + text;
  }
};

function formatSpan(span) {
  var type = span.shift();
  var text = span.shift();
  assert(span.length == 0);

  switch (type) {
    default: return escape(text);
  };
};

function escape(str) {
  return str.
    replace(/\*/g,'\\*').
    replace(/</g,'\\<').
    replace(/>/g,'\\>');
};
