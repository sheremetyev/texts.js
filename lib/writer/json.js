var assert = require('assert');

module.exports = function formatText(obj, options) {
  assert(obj.shift() == 'text');

  str = obj.map(formatBlock).join(',\n\n');
  if (str.length > 0) {
    str = ',\n\n' + str; // first comma after "text"
  }

  return '["text"' + str + '\n\n]\n';
};

var formatBlock = function (block) {
  var type = block.shift();
  var attr = block.shift();

  var header = JSON.stringify(type) + ', ' + formatAttributes(attr);
  var str = block.map(formatSpan).join(',\n');
  if (str.length > 0) {
    str = ',\n' + str;
  }

  return '  [' + header + str + '\n  ]';
};

var formatSpan = function (span) {
  assert(span.length == 2);
  var type = span[0];
  var text = span[1];

  return '    [' + JSON.stringify(type) + ', ' + JSON.stringify(text) + ']';
};

var formatAttributes = function(attr) {
  return JSON.stringify(attr);
};
