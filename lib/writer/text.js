var assert = require('assert');
var wrap = require('../wrap');

module.exports = function formatText(text, options) {
  assert(text.shift() == 'text');

  var result = [];
  var numbers = [0, 0, 0, 0];

  var index = 0;
  while (index < text.length) {
    var block = text[index++];
    result.push(formatBlock(block, numbers));
  };

  var output = result.join('\n\n') + '\n';
  return output;
};

function formatBlock(block, numbers) {
  var type = block.shift();
  var attr = block.shift();

  if (type === 'numbered') {
    numbers[attr.level]++;
  } else {
    numbers[attr.level] = 0;
  }

  // reset numbers for all levels below
  for (var i = attr.level+1; i <= 3; i++)
    numbers[i] = 0;

  switch (type) {
    case 'divider': return repeat('-', 80);
    case 'image': return repeat('    ', attr.level) + '![](' + wordWrap(formatSpans(block)) + ')';
    case 'heading': return formatHeading(wordWrap(formatSpans(block)), attr.level);
    case 'bulleted': return wordWrap(formatSpans(block), repeat('    ', attr.level + 1), repeat('    ', attr.level) + '  - ');
    case 'numbered':
      var number = numbers[attr.level] + '. ';
      if (number.length < 4)
        number = ' ' + number;
      return wordWrap(formatSpans(block), repeat('    ', attr.level + 1), repeat('    ', attr.level) + number);
    case 'quote': return wordWrap(formatSpans(block), repeat('    ', attr.level) + '  > ');
    case 'link':
      assert(block.length > 0);
      var linkRef = block.shift();
      assert(linkRef[0] === 'linkref');
      return wordWrap(formatSpans(block), repeat('    ', attr.level), repeat('    ', attr.level) + '[' + linkRef[1] + ']: ');
    case 'note':
      assert(block.length > 0);
      var noteRef = block.shift();
      assert(noteRef[0] === 'noteref');
      return wordWrap(formatSpans(block), repeat('    ', attr.level), repeat('    ', attr.level) + '[^' + noteRef[1] + ']: ');
    case 'verbatim':
      var border = repeat('    ', attr.level) + repeat('~', 80 - attr.level*4);
      return border + '\n' + formatVerbatim(block, repeat('    ', attr.level)) + '\n' + border;
    case 'formula':
      return repeat('    ', attr.level) + '$$\n' + formatVerbatim(block, repeat('    ', attr.level)) + '\n' + repeat('    ', attr.level) + '$$';
    default: return wordWrap(formatSpans(block), repeat('    ', attr.level));
  };
};

function formatHeading(text, level) {
  switch (level) {
    case -3: return text + '\n' + repeat('=', text.length);
    case -2: return text + '\n' + repeat('-', text.length);
    default: return '### ' + text;
  }
};

function wordWrap(text, prefix, firstPrefix) {
  return wrap(text, prefix, firstPrefix, '  ');
};

function formatSpans(spans) {
  return spans.map(formatSpan).join('');
}

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
    case 'math': return '$' + escape(text) + '$';
    case 'url': return '<' + escape(text) + '>';
    default: return escape(text);
  };
};

function formatVerbatim(spans, prefix) {
  var text = spans.map(function (span) {
    if (span[0] === 'break')
      return span[1];
    return prefix + span[1];
  });
  return text.join('');
};

function escape(str) {
  return str.
    replace(/\\/g,'\\\\').
    replace(/\*/g,'\\*').
    replace(/`/g,'\\`').
    replace(/\$/g,'\\$').
    replace(/</g,'\\<').
    replace(/>/g,'\\>');
};

function repeat(str, times) {
  return new Array(times+1).join(str);
};
