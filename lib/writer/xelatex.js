var assert = require('assert');
var wrap = require('../wrap');

module.exports = function formatText(text, options) {
  assert(text.shift() == 'text');

  var result = [];
  var lists = [];

  var links = extractLinks(text);
  var notes = extractNotes(text, links);

  text.forEach(function(block) {
    var type = block[0];
    var level = block[1].level;

    if (type === 'heading')
      level = 0;

    // close nested lists
    while (lists.length > level) {
      var lastType = lists.pop();
      var prefix = repeat('    ', lists.length);
      result.push(prefix + '\\end{' + formatListType(lastType) + '}');
    }

    // junction of bulleted and numbered lists or vice versa → close last level
    if (lists.length === level &&
        level > 0 &&
        (type === 'bulleted' || type === 'numbered') &&
        lists[lists.length-1] !== type) {
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

    var str = formatBlock(block, links, notes);
    if (str !== null)
      result.push(str);
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

var extractLinks = function(blocks) {
  var links = {};
  blocks.forEach(function(block) {
    var type = block[0];
    if (type !== 'link')
      return;
    var spans = block.slice(2);
    if (spans.length < 2 || spans[0][0] !== 'linkref' || spans[1][0] !== 'url')
      return;
    var ref = spans[0][1];
    var url = spans[1][1];
    links[ref] = url;
  });
  return links;
};

var extractNotes = function(blocks, links) {
  var notes = {};
  blocks.forEach(function(block) {
    var type = block[0];
    if (type !== 'note')
      return;
    var spans = block.slice(2);
    if (spans.length < 1 || spans[0][0] !== 'noteref')
      return;
    var ref = spans[0][1];
    notes[ref] = formatSpans(spans.slice(1), links);
  });
  return notes;
};

function formatBlock(block, links, notes) {
  var type = block.shift();
  var attr = block.shift();

  switch (type) {
    case 'divider': return '\\hrulefill';
    case 'image': return formatImage(block);
    case 'heading': return '\\' + repeat('sub', attr.level-1) + 'section{' + formatSpans(block, links, notes) + '}';
    case 'bulleted':
    case 'numbered':
      var prefix = repeat('    ', attr.level-1);
      return wordWrap(formatSpans(block, links, notes), prefix, prefix + '\\item ');
    case 'quote': return '\\begin{quotation}\n' + wordWrap(formatSpans(block, links, notes)) + '\n\\end{quotation}';
    case 'link': return null;
    case 'note': return null;
    case 'verbatim': return '\\begin{verbatim}\n' + formatVerbatimSpans(block) + '\n\\end{verbatim}';
    case 'formula': return  '\\begin{equation}\n' + formatVerbatimSpans(block) + '\n\\end{equation}';
    default: return wordWrap(formatSpans(block, links, notes));
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

function formatSpans(spans, links, notes) {
  return spans.map(function formatSpan(span, index) {
    var type = span.shift();
    var text = span.shift();
    assert(span.length == 0);

    switch (type) {
      case 'emph': return '\\emph{' + escape(text) + '}';
      case 'strong': return '\\textbf{' + escape(text) + '}';
      case 'code': return '\\texttt{' + escape(text) + '}';
      case 'math': return '$' + text + '$';
      case 'url': return '\\url{' + text + '}';
      case 'linktext':
        if (index + 1 < spans.length && spans[index+1][0] === 'linkref') {
          var ref = spans[index+1][1];
          return '\\href{' + links[ref] + '}{' + escape(text) + '}';
        } else {
          return null;
        }
      case 'linkref': return null;
      case 'noteref': return '\\footnote{' + notes[text] + '}';
      default: return escape(text);
    };
  }).join('');
};

function formatVerbatimSpans(spans) {
  return spans.map(function formatSpan(span, index) {
    var type = span.shift();
    var text = span.shift();
    assert(span.length == 0);
    assert(type === 'plain' || type === 'break');
    return text;
  }).join('');
};

var formatListType = function(type) {
  switch(type) {
    case 'bulleted': return 'itemize';
    case 'numbered': return 'enumerate';
    default: return '';
  }
};

function escape(str) {
  // can't add braces after keywords at first because they will be escaped
  return str.
    replace(/\\/g,'\\textbackslash').
    replace(/\^/g,'\\textasciicircum').
    replace(/\~/g,'\\textasciitilde').
    replace(/\%/g,'\\%').
    replace(/\_/g,'\\_').
    replace(/\&/g,'\\&').
    replace(/\#/g,'\\#').
    replace(/\{/g,'\\{').
    replace(/\}/g,'\\}').
    replace(/\$/g,'\\$').
    replace(/\\textbackslash/g,'\\textbackslash{}').
    replace(/\\textasciicircum/g,'\\textasciicircum{}').
    replace(/\\textasciitilde/g,'\\textasciitilde{}');
};

function repeat(str, times) {
  return new Array(times+1).join(str);
};

var header = 
  '\\documentclass[10pt]{article}\n' +
  '\n' +
  '% set smaller margins\n' +
  '\\usepackage[a4paper,margin=1in]{geometry}\n' +
  '\n' +
  '% use standard math symbols\n' +
  '\\usepackage{amssymb}\n' +
  '\n' +
  '% for \\text inside formulas and for \\eqref\n' +
  '\\usepackage{amsmath}\n' +
  '\n' +
  '% enable full XeLaTeX power\n' +
  '\\usepackage{xltxtra}\n' +
  '\n' +
  '% select widely available fonts\n' +
  '\\setmainfont{Georgia}\n' +
  '\\setmonofont{Courier New}\n' +
  '\n' +
  '% set paragraph margins\n' +
  '\\setlength{\\parindent}{0pt}\n' +
  '\\setlength{\\parskip}{6pt plus 2pt minus 1pt}\n' +
  '\n' +
  '% prevent overfull lines\n' +
  '\\setlength{\\emergencystretch}{3em}\n' +
  '\n' +
  '% for \\includegraphics\n' +
  '\\usepackage{graphicx}\n' +
  '\n' +
  '% for exact placement of figures\n' +
  '\\usepackage{float}\n' +
  '\n' +
  '% for hyperlinks\n' +
  '\\usepackage[colorlinks,urlcolor=blue,filecolor=blue,linkcolor=black,citecolor=black]{hyperref}\n' +
  '\\usepackage[all]{hypcap}\n' +
  '\\urlstyle{same}\n' +
  '\n' +
  '\\begin{document}\n' +
  '\n';

var footer =
  '\n\\end{document}\n';
