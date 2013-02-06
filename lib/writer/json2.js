var assert = require('assert');

module.exports = function formatText(obj, options) {
  assert(obj.shift() == 'text');
  return JSON.stringify(transform(obj), null, 2);
};

var transform = function(blocks) {
  var blocks = blocks.map(function transformBlock(block) {
    var type = block.shift();
    var attr = block.shift();

    var spans = block.map(function transformSpan(span) {
      var type = span.shift();
      var text = span.shift();
      return { "tags": [type], "text": text };
    });

    return { "level": attr.level, "tags": [type], "spans": spans };
  });

  return { "tags": [], "blocks": blocks };
};
