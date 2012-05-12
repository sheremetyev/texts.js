var pegjs = require('pegjs');
var grammar = require('fs').readFileSync(__dirname + '/text.peg', 'utf8');
var parser = pegjs.buildParser(grammar);

module.exports = function parse(str) {
  return parser.parse(str);
};
