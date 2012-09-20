var assert = require('assert');

module.exports = function formatText(text, options) {
  assert(text.shift() == 'text');
  var metadata = { "docTitle": [], "docAuthors": [], "docDate": [] };
  var blocks = [];
  return JSON.stringify([metadata, blocks]);
};
