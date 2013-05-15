var assert = require('assert');
var wrap = require('../wrap');

module.exports = function formatText(text, options) {
  assert(text.shift() == 'text');

  var result = [];
  var numbers = [0, 0, 0, 0];

  var index = 0;
  while (index < text.length) {
    var block = text[index++];

    if (block[0] === 'row') {
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
      continue;
    }

    var isRTL = block[1].direction === 'rtl';
    var blockText = formatBlock(block, numbers, options.wrap)
    if (isRTL) {
      blockText = '\u200F' + blockText.split('\n').join('\n\u200F');
    }
    result.push(blockText);
  }

  var output = result.join('\n\n') + '\n';
  return output;
};

function formatBlock(block, numbers, shouldWrap) {
  var wordWrap = function (text, prefix, firstPrefix) {
    prefix = prefix || '';
    firstPrefix = firstPrefix || prefix;
    if (shouldWrap)
      return wrap(text, prefix, firstPrefix, '  ');
    return firstPrefix + text.split('\n').join('  ' + '\n' + prefix);
  };

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
    case 'heading': return formatHeading(formatSpans(block), attr.level);
    case 'bulleted': return wordWrap(formatSpans(block), repeat('    ', attr.level + 1), repeat('    ', attr.level) + '-   ');
    case 'numbered':
      var number = numbers[attr.level] + '. ';
      if (number.length < 4)
        number += ' ';
      return wordWrap(formatSpans(block), repeat('    ', attr.level + 1), repeat('    ', attr.level) + number);
    case 'quote': return wordWrap(formatSpans(block), repeat('    ', attr.level) + '>   ');
    case 'comment': return wordWrap(formatSpans(block), repeat('    ', attr.level) + '//  ');
    case 'link':
      var linkRef = '';
      if (block.length > 0 && block[0][0] === 'linkref') {
        linkRef = block.shift()[1];
      }
      return wordWrap(formatSpans(block), repeat('    ', attr.level), repeat('    ', attr.level) + '[' + linkRef + ']: ');
    case 'note':
      var noteRef = '';
      if (block.length > 0 && block[0][0] === 'noteref') {
        noteRef = block.shift()[1];
      }
      return wordWrap(formatSpans(block), repeat('    ', attr.level), repeat('    ', attr.level) + '[^' + noteRef + ']: ');
    case 'verbatim':
      var border = repeat('    ', attr.level) + repeat('~', 80 - attr.level*4);
      return border + '\n' + formatVerbatim(block, repeat('    ', attr.level)) + '\n' + border;
    case 'formula':
      return repeat('    ', attr.level) + '$$\n' + formatVerbatim(block, repeat('    ', attr.level)) + '\n' + repeat('    ', attr.level) + '$$';
    default: return wordWrap(formatSpans(block), repeat('    ', attr.level));
  }
}

function formatHeading(text, level) {
  switch (level) {
    case -3: return text + '\n' + repeat('=', text.length);
    case -2: return text + '\n' + repeat('-', text.length);
    default: return '### ' + text;
  }
}

function formatSpans(spans) {
  return spans.map(function(span, index) {
    assert(span.length == 2);
    var type = span[0];
    var text = span[1];

    switch (type) {
      case 'emph': return '*' + escapeChar(text, '*') + '*';
      case 'strong': return '**' + escapeChar(text, '*') + '**';
      case 'code': return '`' + escapeChar(text, '`') + '`';
      case 'linktext': return '[' + escapeChar(text, ']') + ']';
      case 'linkref': return '[' + escapeChar(text, ']') + ']';
      case 'noteref': return '[^' + escapeChar(text, ']') + ']';
      case 'math': return '$' + escapeChar(text, '$') + '$';
      case 'url':
        if (index > 0 && spans[index-1][0] === 'linktext')
          return '(<' + escapeChar(text, '>') + '>)';
        else
          return '<' + escapeChar(text, '>') + '>';
      default: return escape(text);
    }
  }).join('');
}

function formatTable(table) {
  var rows = table.length;
  var cols = table.reduce(function (val, row) { return Math.max(row.length, val); }, 1);

  var widths = [];
  for (var i = 0; i < cols; i++) {
    widths[i] = table.reduce(function (val, row) {
      var cell = row[i];
      var text = formatSpans(cell);
      return Math.min(40, Math.max(text.length, val));
    }, 1);
  }

  var tableText = table.map(function (row) {
    var cellsLines = row.map(function (cell, index) {
      var text = formatSpans(cell);
      var lines = wrap(text, '', '', '', widths[index]).split('\n');
      return  lines.map(function (line) {
        return line + repeat(' ', widths[index] - line.length);
      });
    });

    var maxLines = cellsLines.reduce(function (val, lines) { return Math.max(val, lines.length); }, 1);
    var rowLines = [];
    for (var i = 0; i < maxLines; i++) {
      var rowLine = cellsLines.map(function (lines, index) { return lines[i] || repeat(' ', widths[index]); });
      rowLines.push('| ' + rowLine.join(' | ') + ' |');
    }
    return rowLines.join('\n');
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
}

function escape(str) {
  return str.
    replace(/\\/g,'\\\\').
    replace(/\*/g,'\\*').
    replace(/\`/g,'\\`').
    replace(/\$/g,'\\$').
    replace(/\</g,'\\<').
    replace(/\>/g,'\\>');
}

function escapeChar(str, ch) {
  return str.replace(new RegExp('\\' + ch, 'g'),'\\' + ch);
}

function repeat(str, times) {
  return new Array(times+1).join(str);
}
