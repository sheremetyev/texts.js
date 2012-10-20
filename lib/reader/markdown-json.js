var assert = require('assert');

module.exports = function parse(str) {
  var json = JSON.parse(str);
  assert(json.shift() === "MARKDOWN");
  return ['text'];
};
