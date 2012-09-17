module.exports = function parse(str) {
  var json = JSON.parse(str);
  var pandocBlocks = json[1];

  var blocks = [];
  pandocBlocks.forEach(function (block) {
    if (block.hasOwnProperty('Para')) {
      var pandocInlines = block['Para'];
  
      var inlines = [];
      var current = "";
      pandocInlines.forEach(function(inline) {
        if (inline == 'Space') {
          current += ' ';
        } else if (inline.hasOwnProperty('Str')) {
          current += inline['Str'];
        }
      });
      inlines.push(['plain', current]);

      blocks.push(['para', { 'level': 0 }].concat(inlines));
    }
  });

  return ['text'].concat(blocks);
};
