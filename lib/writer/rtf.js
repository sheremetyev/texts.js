var assert = require('assert');

module.exports = function formatText(text, options) {
  assert(text.shift() == 'text');

  // format all blocks
  var output = text.map(formatBlock).join('\n');

  if (options.standalone)
    output = header + output + '}\n';

  return output;
};

function formatBlock(block) {
  var type = block.shift();
  var attr = block.shift();

  var result = '{\\pard ';

  switch (type) {
    case 'heading':
      switch(attr.level) {
        case -3: result += '\\f0 \\fs48 \\sb300 '; break;
        case -2: result += '\\f0 \\fs40 \\sb300 '; break;
        case -1: default: result += '\\f0 \\fs32 \\sb300 '; break;
      }
      break;

    case 'bulleted':
    case 'numbered': // TODO: implement numbered lists
      result += '\\fi-720 \\bullet \\tx720\\tab ';
      switch(attr.level) {
        case 1: result += '\\li720 '; break;
        case 2: result += '\\li1440 '; break;
        case 3: result += '\\li2160 '; break;
        // TODO: more levels
      }
      result += '\\f0 \\fs22 \\sb200 ';
      break;

    case 'divider':
    case 'image':
    case 'link':
    case 'note':
       return ''; // unsupported block types

    case 'verbatim':
      result += '\\f1 \\fs22 \\sb200 \\cb2 ';
      break;

    case 'formula':
      result += '\\f1 \\fs22 \\sb200 \\cf3 ';
      break;

    case 'quote':
    case 'para':
    default:
      result += '\\f0 \\fs22 \\sb200 '; break;
  }

  // format spans
  result += block.map(formatSpan).join('');

  result += '\\par}';
  return result;
}

function formatSpan(span) {
  var type = span.shift();
  var text = span.shift();

  switch (type) {
    case 'break':
      return '\\line ';

    case 'emph':
      return '{\\i ' + escapeText(text) + '}';

    case 'strong':
      return '{\\b ' + escapeText(text) + '}';

    case 'code':
      return '{\\f1\\cb2 ' + escapeText(text) + '}';

    case 'math':
      return '{\\f1\\cf3 ' + escapeText(text) + '}';

    case 'url':
      var url = escapeText(text);
      return '{\\field{\\*\\fldinst HYPERLINK "' + url + '"}{\\fldrslt ' + url + '}}';

    case 'plain':
    default:
      return escapeText(text);
  }
}

function escapeText(text) {
  var output = '';
  for (var i = 0; i < text.length; i++) {
    var code = text.charCodeAt(i);
    if (code == '{'.charCodeAt(0)) {
      output += '\\{';
    } else if (code == '}'.charCodeAt(0)) {
      output += '\\}';
    } else if (code == '\\'.charCodeAt(0)) {
      output += '\\\\';
    } else if (code <= 0x7f) {
      output += String.fromCharCode(code);
    } else {
      output += '\\u' + code.toString() + '?';
    }
  }
  return output;
}

var fonts =
  '{\\fonttbl' +
  '{\\f0 \\froman Verdana;}' +
  '{\\f1 \\fmodern Courier New;}' +
  '}';

var colors =
  '{\\colortbl;' +
  '\\red0\\green0\\blue0;' +
  '\\red224\\green224\\blue224;' +
  '\\red128\\green128\\blue128;' +
  '}';

var header =
  '{\\rtf1\\ansi\\deff0' + fonts + colors + '\n';
