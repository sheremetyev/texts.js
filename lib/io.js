exports.readInput = function(cb) {
  var input = [];
  process.stdin.on('data', function(data) { input.push(data); });
  process.stdin.on('end', function() { cb(null, input.join('')); });
  process.stdin.setEncoding('utf8');
  process.stdin.resume();
};

exports.writeOutput = function(str) {
  process.stdout.write(str);
};
