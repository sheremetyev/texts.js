var assert = require('assert');
var wrap = require('../wrap');

module.exports = function formatText(text, options) {
  assert(text.shift() == 'text');

  var result = [];
  var lists = [];

  text.forEach(function(block) {
    var type = block[0];
    var level = block[1].level;

    // close nested lists
    while (lists.length > level) {
      var lastType = lists.pop();
      var prefix = repeat('    ', lists.length);
      result.push(prefix + '\\end{' + formatListType(lastType) + '}');
    }

    // start lists if necessary
    if (type === 'bulleted' || type === 'numbered') {
      while (lists.length < level) {
        var prefix = repeat('    ', lists.length);
        result.push(prefix + '\\begin{' + formatListType(type) + '}');
        lists.push(type);
      }
    }

    result.push(formatBlock(block, lists));
  });

  // close all open lists
  while (lists.length > 0) {
    var lastType = lists.pop();
    var prefix = repeat('    ', lists.length);
    result.push(prefix + '\\end{' + formatListType(lastType) + '}');
  }

  var output = result.join('\n\n') + '\n';
  if (options.standalone)
    output = header + output + footer;
  return output;
};

function formatBlock(block) {
  var type = block.shift();
  var attr = block.shift();

  switch (type) {
    case 'divider': return '\\hrulefill';
    case 'image': return formatImage(block);
    case 'heading': return '\\' + repeat('sub', attr.level-1) + 'section{' + formatSpans(block) + '}';
    case 'bulleted':
    case 'numbered':
      var prefix = repeat('    ', attr.level-1);
      return wordWrap(formatSpans(block), prefix, prefix + '\\item ');
    case 'quote': return '\\begin{quotation}\n' + wordWrap(formatSpans(block)) + '\n\\end{quotation}';
    case 'link': return null;
    case 'note': return null;
    case 'verbatim': return '\\begin{verbatim}\n' + formatSpans(block) + '\n\\end{verbatim}';
    case 'formula': return  '\\begin{equation}\n' + formatSpans(block) + '\n\\end{equation}';
    default: return wordWrap(formatSpans(block));
  };
};

var formatImage = function(spans) {
  if (spans.length > 0 && spans[0][0] === 'url') {
    var url = spans[0][1];
    var str =
'\\begin{figure}[H]\n' +
'\\centering\n' +
'\\includegraphics{' + url + '}\n' +
'\\end{figure}';
    return str;
  }
  return formatSpans(spans);
};

function wordWrap(text, prefix, firstPrefix) {
  return wrap(text, prefix, firstPrefix, '\\\\');
};

function formatSpans(spans) {
  return spans.map(formatSpan).join('');
}

function formatSpan(span) {
  var type = span.shift();
  var text = span.shift();
  assert(span.length == 0);

  switch (type) {
    case 'emph': return '\\emph{' + escape(text) + '}';
    case 'strong': return '\\textbf{' + escape(text) + '}';
    case 'code': return '\\texttt{' + escape(text) + '}';
    case 'math': return '$' + escape(text) + '$';
    case 'url': return '\\url{' + escape(text) + '}';
    case 'linktext': return null;
    case 'linkref': return null;
    case 'noteref': return null;
    default: return escape(text);
  };
};

var formatListType = function(type) {
  switch(type) {
    case 'bulleted': return 'itemize';
    case 'numbered': return 'enumerate';
    default: return '';
  }
};

function escape(str) {
  return str.
    replace(/\\/g,'\\textbackslash').
    replace(/{/g,'\\{').
    replace(/}/g,'\\}').
    replace(/~/g,'\\~{}').
    replace(/\$/g,'\\$');
};

function repeat(str, times) {
  return new Array(times+1).join(str);
};

var header = 
  '\\documentclass[10pt]{article}\n' +
  '\n' +
  '\\begin{document}\n\n';

var footer =
  '\n\n\\end{document}\n';
