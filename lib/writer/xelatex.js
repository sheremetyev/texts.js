var assert = require('assert');

module.exports = function formatText(text) {
  assert(text.shift() == 'text');

  var result = [];
  text.forEach(function(block) {
    result.push(formatBlock(block));
  });

  return header + result.join('\n\n') + footer;
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
    default: return text;
  };
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
    replace(/\\/g,'\\textbackslash').
    replace(/{/g,'\\{').
    replace(/}/g,'\\}').
    replace(/~/g,'\\~{}').
    replace(/\$/g,'\\$');
};

var header = 
  '\\documentclass[10pt]{article}\n' +
  '\n' +
  '\\begin{document}\n\n';

var footer =
  '\n\n\\end{document}\n';
