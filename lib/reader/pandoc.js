var assert = require('assert');

module.exports = function parse(str) {
  var json = JSON.parse(str);
  var pandocBlocks = json[1];
  var blocks = convertBlocks(pandocBlocks, 0);
  return ['text'].concat(blocks);
};

var convertBlocks = function (pandocBlocks, level) {
  var blocks = [];
  pandocBlocks.forEach(function (block) {
    block = objectToArray(block);
    var type = block[0];
    var value = block[1];
    switch (type) {

      case 'Plain':
      case 'Para':
        // Plain [Inline] -- Plain text, not a paragraph
        // Para [Inline] -- Paragraph
        var inlines = convertInlines(value);
        blocks.push(['para', { 'level': level }].concat(inlines));
        break;

      case 'CodeBlock':
        // CodeBlock Attr String -- Code block (literal) with attributes
        var inlines = convertVerbatim(value[1]);
        blocks.push(['verbatim', { 'level': level }].concat(inlines));
        break;

      case 'RawBlock':
        // RawBlock Format String -- Raw block
        break;

      case 'BlockQuote':
        // BlockQuote [Block] -- Block quote (list of blocks)
        break;

      case 'OrderedList':
        // OrderedList ListAttributes [[Block]] -- Ordered list (attributes and
        // a list of items, each a list of blocks)
        var listBlocks = convertList(value[1], 'numbered', level);
        blocks = blocks.concat(listBlocks);
        break;

      case 'BulletList':
        // BulletList [[Block]] --  Bullet list (list of items, each a list of
        // blocks)
        var listBlocks = convertList(value, 'bulleted', level);
        blocks = blocks.concat(listBlocks);
        break;

      case 'DefinitionList':
        // DefinitionList [([Inline],[[Block]])] -- Definition list
        // Each list item is a pair consisting of a term (a list of inlines)
        // and one or more definitions (each a list of blocks)
        break;

      case 'Header':
        // Header Int [Inline] -- Header - level (integer) and text (inlines)
        var headingLevel = value[0];
        headingLevel -= 4;
        var inlines = convertInlines(value[1]);
        blocks.push(['heading', { 'level': headingLevel }].concat(inlines));
        break;

      case 'HorizontalRule':
        // HorizontalRule -- Horizontal rule
        break;

      case 'Table':
        // Table [Inline] [Alignment] [Double] [TableCell] [[TableCell]] -- Table,
        // with caption, column alignments, relative column widths (0 = default),
        // column headers (each a list of blocks), and rows (each a list of
        // lists of blocks)
        break;

    }
  });
  return blocks;
};

var convertList = function (items, type, level) {
  var blocks = [];

  items.forEach(function (item) {
    var itemBlocks = convertBlocks(item, level+1);
    assert(itemBlocks.length > 0);
    itemBlocks[0][0] = type;
    itemBlocks[0][1].level = level;
    blocks = blocks.concat(itemBlocks);
  });

  return blocks;
};

var convertInlines = function (pandocInlines) {
  var inlines = [];
  var current = "";
  pandocInlines.forEach(function(inline) {
    inline = objectToArray(inline);
    var type = inline[0];
    var value = inline[1];
    switch (type) {

      case 'Str':
        // Str String -- Text (string)
        current += value;
        break;

      case 'Emph':
        // Emph [Inline] -- Emphasized text (list of inlines)
        break;

      case 'Strong':
        // Strong [Inline] -- Strongly emphasized text (list of inlines)
        break;

      case 'Strikeout':
        // Strikeout [Inline] -- Strikeout text (list of inlines)
        break;

      case 'Superscript':
        // Superscript [Inline] -- Superscripted text (list of inlines)
        break;

      case 'Subscript':
        // Subscript [Inline] -- Subscripted text (list of inlines)
        break;

      case 'SmallCaps':
        // SmallCaps [Inline] -- Small caps text (list of inlines)
        break;

      case 'Quoted':
        // Quoted QuoteType [Inline] -- Quoted text (list of inlines)
        break;

      case 'Cite':
        // Cite [Citation]  [Inline] -- Citation (list of inlines)
        break;

      case 'Code':
        // Code Attr String -- Inline code (literal)
        break;

      case 'Space':
        // Space -- Inter-word space
        current += ' ';
        break;

      case 'LineBreak':
        // LineBreak -- Hard line break
        break;

      case 'Math':
        // Math MathType String -- TeX math (literal)
        break;

      case 'RawInline':
        // RawInline Format String -- Raw inline
        break;

      case 'Link':
        // Link [Inline] Target -- Hyperlink: text (list of inlines), target
        break;

      case 'Image':
        // Image [Inline] Target -- Image:  alt text (list of inlines), target
        break;

      case 'Note':
        // Note [Block] -- Footnote or endnote
        break;

    }
  });
  inlines.push(['plain', current]);
  return inlines;
};

var convertVerbatim = function(pandocString) {
  var lines = pandocString.split('\n');
  var inlines = [];
  lines.forEach(function (line) {
    if (inlines.length > 0)
      inlines.push(['break', '\n']);
    inlines.push(['plain', line]);
  });
  return inlines;
};

var objectToArray = function(obj) {
  // Pandoc's JSON is build by translating Haskell data structures and thus
  // is a bit inconveniet for processing. It contains objects with single
  // property where property name denotes object type, e.g. { "Str": "text" }.
  // We translate it into a two-element array like ["Str", "text"].
  // When object is just a string the second element is null.
  
  if (typeof obj == 'string')
    return [obj, null];

  var keys = Object.keys(obj);
  assert(keys.length == 1);
  var key = keys[0];
  return [key, obj[key]];
};
