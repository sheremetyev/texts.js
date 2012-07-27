var assert = require('assert');

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

  var prefix = repeat('    ', attr.level);

  if (type === 'numbered') {
    numbers[attr.level]++;
  }
  // reset numbers for all levels below
  for (var i = attr.level+1; i <= 3; i++)
    numbers[i] = 0;

  switch (type) {
    case 'divider': return repeat('-', 80);
    case 'image': return '![](' + wordWrap(formatSpans(block)) + ')';
    case 'heading': return formatHeading(wordWrap(formatSpans(block)), attr.level);
    case 'bulleted': return wordWrap(formatSpans(block), prefix, repeat('    ', attr.level - 1) + '  * ');
    case 'numbered':
      var number = numbers[attr.level] + '. ';
      if (number.length < 4)
        number = ' ' + number;
      return wordWrap(formatSpans(block), prefix, repeat('    ', attr.level - 1) + number);
    case 'quote': return wordWrap(formatSpans(block), repeat('    ', attr.level - 1) + '  > ');
    case 'link':
      assert(block.length > 0);
      var linkRef = block.shift();
      assert(linkRef[0] === 'linkref');
      return wordWrap(formatSpans(block), '', '[' + linkRef[1] + ']: ');
    case 'note':
      assert(block.length > 0);
      var noteRef = block.shift();
      assert(noteRef[0] === 'noteref');
      return wordWrap(formatSpans(block), '', '[^' + noteRef[1] + ']: ');
    case 'verbatim':
      var border = prefix + repeat('~', 80 - attr.level*4);
      return border + '\n' + formatVerbatim(block, prefix) + '\n' + border;
    case 'formula':
      return prefix + '$$\n' + formatVerbatim(block, prefix) + '\n' + prefix + '$$';
    default: return wordWrap(formatSpans(block), prefix);
  };
};

function formatHeading(text, level) {
  switch (level) {
    case 1: return text + '\n' + repeat('=', text.length);
    case 2: return text + '\n' + repeat('-', text.length);
    default: return repeat('#', level) + ' ' + text;
  }
};

function wordWrap(text, prefix, firstPrefix) {
  prefix = prefix || '';
  firstPrefix = firstPrefix || prefix;

  var maxLen = 80 - prefix.length;

  var breakLines = text.split('\n').map(function (breakLine) {
    var words = breakLine.split(' ');
    var lines = [];
    var line = '';
    words.forEach(function (word) {
      var joined = line + (line.length == 0 ? '' : ' ') + word;
      if (joined.length <= maxLen) {
        line = joined;
      } else {
        lines.push(line.trim());
        line = word;
      }
    });
    if (line.length > 0)
      lines.push(line.trim());
    return lines.join('\n' + prefix);
  });

  return firstPrefix + breakLines.join('  \n' + prefix);
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
