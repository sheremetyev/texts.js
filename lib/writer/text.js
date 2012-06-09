var assert = require('assert');

module.exports = function formatText(text, options) {
  assert(text.shift() == 'text');

  var result = [];
  var numbers = [0, 0, 0, 0];

  var index = 0;
  while (index < text.length) {
    var block = text[index++];
    if (block[0] != 'row') {
      result.push(formatBlock(block, numbers));
    } else {
      // extract whole table
      var table = [];
      var cells = [block.slice(2)];
      while (index < text.length) {
        var block = text[index];
        if (block[0] === 'col') {
          cells.push(block.slice(2));
          index++;
        } else if (block[0] === 'row') {
          table.push(cells);
          cells = [block.slice(2)];
          index++;
        } else {
          break;
        }
      };
      table.push(cells); // final row
      result.push(formatTable(table));
    }
  };

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
    case 'divider': return repeat('-', 80);
    case 'image': return '![](' + formatSpans(block) + ')';
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
    case 'verbatim':
      var border = prefix + repeat('~', 80 - attr.level*4);
      return border + '\n' + formatVerbatim(block, prefix) + '\n' + border;
    case 'formula':
      return prefix + '$$\n' + formatVerbatim(block, prefix) + '\n' + prefix + '$$';
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

  var text = spans.map(formatSpan).join('');

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

function formatTable(table) {
  var rows = table.length;
  var cols = table.reduce(function (val, row) { return Math.max(row.length, val); }, 1);

  var widths = [];
  for (var i = 0; i < cols; i++) {
    widths[i] = table.reduce(function (val, row) {
      var cell = row[i];
      var text = formatSpans(cell);
      return Math.max(text.length, val);
    }, 1);
  }

  var tableText = table.map(function (row) {
    var cellsText = row.map(function (cell, index) {
      var text = formatSpans(cell);
      return text + repeat(' ', widths[index] - text.length);
    });
    return '| ' + cellsText.join(' | ') + ' |';
  });

  var divider = '+' + widths.map(function (width) { return repeat('-', width + 2); }).join('+') + '+';
  return divider + '\n' + tableText.join('\n' + divider + '\n') + '\n' + divider;
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
    replace(/\[/g,'\\[').
    replace(/\]/g,'\\]').
    replace(/</g,'\\<').
    replace(/>/g,'\\>');
};

function repeat(str, times) {
  return new Array(times+1).join(str);
};
