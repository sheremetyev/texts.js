var through = require('through');

var writers = {
  'json':           require('./writer/json.js'),
  'text':           require('./writer/text.js'),
  'pandoc-json':    require('./writer/pandoc-json.js'),
  'xelatex':        require('./writer/xelatex.js'),
  'jsonml':         require('./writer/jsonml.js'),
  'html5':          require('./writer/html5.js'),
};

var readers = {
  'json':           require('./reader/json.js'),
  'text':           require('./reader/text.js'),
  'pandoc-json':    require('./reader/pandoc-json.js'),
  'markdown-json':  require('./reader/markdown-json.js'),
};

module.exports = function(inputFormat, outputFormat, options) {
  var options = options || {};
  var result = through(write, end);
  var buf = [];

  function write(data) {
    buf.push(data.toString());
  }

  function end() {
    var input  = buf.join('');
    var model  = readers[inputFormat](input);
    var output = writers[outputFormat](model, options);
    result.emit('data', output);
    result.end();
  }

  return result;
}

module.exports.readers = readers;
module.exports.writers = writers;
