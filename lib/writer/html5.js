var assert = require('assert');

var jsonml = require('./jsonml');

module.exports = function formatText(text, options) {
  var json = jsonml.formatJson(text, options);

  var elements = json.map(formatNode);
  var output = elements.join('\n\n') + '\n';

  if (options.standalone)
    output = header + output + footer;
  return output;
};

var formatNode = function(node) {
  if (isString(node))
    return escape(node);

  var tag = node.shift();

  switch (tag) {
    case 'hr': return '<hr>';
    case 'br': return '<br>\n';
  }

  var attr = '';
  if (node.length > 0 && isObject(node[0])) {
    attr = formatAttributes(node.shift());
  }

  switch (tag) {
    case 'img': return '<' + tag + attr + '>';
  }

  var children = node.map(formatNode).join('');

  switch (tag) {
    case 'ol':
    case 'ul':
    case 'li':
    case 'figure':
    case 'blockquote':
    case 'table':
    case 'tr':
    case 'td':
      children = '\n' + children + '\n';
      break;
  }

  return '<' + tag + attr + '>' + children + '</' + tag + '>';
};

var formatAttributes = function(attr) {
  var result = '';
  for (var key in attr) {
    result += ' ' + key + '="' + escapeAttribute(attr[key]) + '"';
  }
  return result;
};

var isString = function(obj) { return obj.constructor === String; };
var isObject = function(obj) { return obj.constructor === Object; };

var escape = function(str) {
  return str.
    replace(/&/g,'&amp;').
    replace(/</g,'&lt;').
    replace(/>/g,'&gt;');
};

var escapeAttribute = function(str) {
  return escape(str).
    replace(/"/g, '&quot;').
    replace(/'/g, '&#39;');
};

var scriptTag = 'script';

var header =
  '<!DOCTYPE html>\n' +
  '<html>\n' +
  '<head>\n' +
  '<meta charset="UTF-8">\n' +
  '<' + scriptTag + ' type="text/javascript" src="http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></' + scriptTag + '>\n' +
  '</head>\n' +
  '<body>\n\n';

var footer =
  '\n\n' +
  '</body>\n' +
  '</html>\n';
