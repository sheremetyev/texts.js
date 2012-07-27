module.exports = function (text, prefix, firstPrefix, breakSuffix) {
  prefix = prefix || '';
  firstPrefix = firstPrefix || prefix;
  breakSuffix = breakSuffix || '';

  var maxLen = 80 - prefix.length;

  var breakLines = text.split('\n').map(function (breakLine) {
    var words = breakLine.split(' ');
    var lines = [];
    var line = '';
    words.forEach(function (word) {
      var joined = line + (line.length == 0 ? '' : ' ') + word;
      if (joined.length <= maxLen) {
        line = joined;
      } else {
        lines.push(line.trim());
        line = word;
      }
    });
    if (line.length > 0)
      lines.push(line.trim());
    return lines.join('\n' + prefix);
  });

  return firstPrefix + breakLines.join(breakSuffix + '\n' + prefix);
};
