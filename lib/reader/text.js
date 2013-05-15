var pegjs = require('pegjs');
var blockGrammar = require('fs').readFileSync(__dirname + '/text-blocks.peg', 'utf8');
var inlineGrammar = require('fs').readFileSync(__dirname + '/text-inlines.peg', 'utf8');
var blockParser = pegjs.buildParser(blockGrammar);
var inlineParser = pegjs.buildParser(inlineGrammar);

module.exports = function parse(str) {
  var blocks = blockParser.parse(str);
  blocks.forEach(function (block) {
    var inlines = [block.shift()];
    block.forEach(function (inline) {
      if (typeof inline === "string") {
        if (inline.length > 0) {
          inlines = inlines.concat(inlineParser.parse(inline));
        }
      } else {
        inlines.push(inline);
      }
    });
    // replace all elements in the block
    [].splice.apply(block, [0, block.length].concat(inlines));
  });
  return ['text'].concat(blocks);
};
