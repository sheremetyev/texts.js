module.exports = function (text, prefix, firstPrefix, breakSuffix, width) {
  prefix = prefix || '';
  firstPrefix = firstPrefix || prefix;
  breakSuffix = breakSuffix || '';
  width = width || 80;

  var maxLen = width - prefix.length;
  var maxLenFirst = width - firstPrefix.length;

  var breakLines = text.split('\n').map(function (breakLine) {
    var words = breakLine.split(' ');
    var lines = [];
    var line = '';
    words.forEach(function (word) {
      var joined = line + (line.length === 0 ? '' : ' ') + word;
      var fits = lines.length === 0 ? joined.length <= maxLenFirst : joined.length <= maxLen;
      if (fits || line.length === 0) {
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
