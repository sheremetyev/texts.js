var assert = require('assert');

module.exports = function formatText(text, options) {
  assert(text.shift() == 'text');

  var result = [];
  var numbers = [0, 0, 0, 0];
  text.forEach(function(block) {
    result.push(formatBlock(block, numbers));
  });

  var output = result.join('\n\n') + '\n';
  return output;
};

function formatBlock(block, numbers) {
  var type = block.shift();
  var attr = block.shift();

  var prefix = repeat('    ', attr.level);

  if (type === 'numitem') {
    numbers[attr.level]++;
  }
  // reset numbers for all levels below
  for (var i = attr.level+1; i <= 3; i++)
    numbers[i] = 0;

  switch (type) {
    case 'heading': return formatHeading(formatSpans(block), attr.level);
    case 'item': return formatSpans(block, prefix, repeat('    ', attr.level - 1) + '  * ');
    case 'numitem':
      var number = numbers[attr.level] + '. ';
      if (number.length < 4)
        number = ' ' + number;
      return formatSpans(block, prefix, repeat('    ', attr.level - 1) + number);
    case 'quote': return formatSpans(block, repeat('    ', attr.level - 1) + '  > ');
    case 'link':
      var linkId = block.length > 0 ? block.shift() : ['id', '?'];
      assert(linkId[0] === 'id');
      return formatSpans(block, '', '[' + linkId[1] + ']: ');
    case 'note':
      var linkId = block.length > 0 ? block.shift() : ['id', '?'];
      assert(linkId[0] === 'id');
      return formatSpans(block, '', '[^' + linkId[1] + ']: ');
    default: return formatSpans(block, prefix);
  };
};

function formatHeading(text, level) {
  switch (level) {
    case 1: return text + '\n' + repeat('=', text.length);
    case 2: return text + '\n' + repeat('-', text.length);
    default: return repeat('#', level) + ' ' + text;
  }
};

function formatSpans(spans, prefix, firstPrefix) {
  prefix = prefix || '';
  firstPrefix = firstPrefix || prefix;

  var maxLen = 80 - prefix.length;

  var lines = [];
  var line = '';
  spans.forEach(function(span) {
    if (span[0] == 'break') {
      lines.push(line.trim() + '  ');
      line = '';
      return;
    }

    var words = formatSpan(span).split(/(\S+\s+)/);
    words.forEach(function (word) {
      var joined = line + word;
      if (joined.length <= maxLen) {
        line = joined;
      } else {
        lines.push(line.trim());
        line = word;
      }
    });
  });
  if (line.length > 0)
    lines.push(line.trim());
  return firstPrefix + lines.join('\n' + prefix);
};

function formatSpan(span) {
  assert(span.length == 2);
  var type = span[0];
  var text = span[1];

  switch (type) {
    case 'emph': return '*' + escape(text) + '*';
    case 'strong': return '**' + escape(text) + '**';
    case 'code': return '`' + escape(text) + '`';
    case 'linktext': return '[' + escape(text) + ']';
    case 'linkref': return '[' + escape(text) + ']';
    case 'noteref': return '[^' + escape(text) + ']';
    case 'url': return '<' + escape(text) + '>';
    default: return escape(text);
  };
};

function escape(str) {
  return str.
    replace(/\\/g,'\\\\').
    replace(/\*/g,'\\*').
    replace(/`/g,'\\`').
    replace(/\[/g,'\\[').
    replace(/\]/g,'\\]').
    replace(/</g,'\\<').
    replace(/>/g,'\\>');
};

function repeat(str, times) {
  return new Array(times+1).join(str);
};
