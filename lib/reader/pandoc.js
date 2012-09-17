module.exports = function parse(str) {
  var json = JSON.parse(str);
  var pandocBlocks = json[1];
  var blocks = convertBlocks(pandocBlocks, 0);
  return ['text'].concat(blocks);
};

var convertBlocks = function (pandocBlocks, level) {
  var blocks = [];
  pandocBlocks.forEach(function (block) {
    for (var prop in block) {
      switch (prop) {
        case 'Para':
          var inlines = convertInlines(block['Para']);
          blocks.push(['para', { 'level': level }].concat(inlines));
          break;
      }
    }
  });
  return blocks;
};

var convertInlines = function (pandocInlines) {
  var inlines = [];
  var current = "";
  pandocInlines.forEach(function(inline) {
    if (inline == 'Space') {
      current += ' ';
      return;
    }
    for (var prop in inline) {
      switch (prop) {
        case 'Str':
          current += inline['Str'];
          break;
      }
    }
  });
  inlines.push(['plain', current]);
  return inlines;
};
