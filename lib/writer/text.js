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

  switch (type) {
    case 'heading': return formatHeading(formatSpans(block, 0), attr.level);
    default: return formatSpans(block, attr.level);
  };
};

function formatHeading(text, level) {
  switch (level) {
    case 1: return text + '\n' + repeat('=', text.length);
    case 2: return text + '\n' + repeat('-', text.length);
    default: return repeat('#', level) + ' ' + text;
  }
};

function formatSpans(spans, indent) {
  var prefix = repeat('    ', indent);
  var lines = [];
  var line = prefix;
  spans.forEach(function(span) {
    if (span[0] == 'break') {
      lines.push(line + '  ');
      line = prefix;
      return;
    }

    var words = formatSpan(span).split(/(\S+\s+)/);
    words.forEach(function (word) {
      word = word.trim();
      if (word.length == 0)
        return;
      var joined = line + (line === prefix ? '' : ' ') + word;
      if (joined.length <= 80) {
        line = joined;
      } else {
        lines.push(line);
        line = prefix + word;
      }
    });
  });
  if (line !== prefix)
    lines.push(line);
  return lines.join('\n');
};

function formatSpan(span) {
  var type = span.shift();
  var text = span.shift();
  assert(span.length == 0);

  switch (type) {
    case 'emph': return '*' + escape(text) + '*';
    default: return escape(text);
  };
};

function escape(str) {
  return str.
    replace(/\*/g,'\\*').
    replace(/</g,'\\<').
    replace(/>/g,'\\>');
};

function repeat(str, times) {
  return new Array(times+1).join(str);
};
