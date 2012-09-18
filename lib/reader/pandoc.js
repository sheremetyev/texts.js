var assert = require('assert');

module.exports = function parse(str) {
  var json = JSON.parse(str);
  var pandocBlocks = json[1];
  var context = { notesCounter: 0 };
  var blocks = convertBlocks(pandocBlocks, 0, context);
  return ['text'].concat(blocks);
};

var convertBlocks = function (pandocBlocks, level, context) {
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
        var textBlocks = convertInlines(value, level, context);
        blocks = blocks.concat(textBlocks);
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
        var textBlocks = convertInlines(value[1], 0, context);
        textBlocks[0][0] = 'heading';
        textBlocks[0][1].level = value[0]-4;
        blocks = blocks.concat(textBlocks);
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

var convertList = function (items, type, level, context) {
  var blocks = [];

  items.forEach(function (item) {
    var itemBlocks = convertBlocks(item, level+1, context);
    assert(itemBlocks.length > 0);
    itemBlocks[0][0] = type;
    itemBlocks[0][1].level = level;
    blocks = blocks.concat(itemBlocks);
  });

  return blocks;
};

var convertInlines = function (pandocInlines, level, context) {
  var notes = [];
  var inlines = flattenInlines(pandocInlines, level, context, notes, []);
  inlines = normalizeInlines(inlines);
  // TODO: extract image and formula blocks
  return [['para', { 'level': level }].concat(inlines)].concat(notes);
};

var flattenInlines = function(pandocInlines, level, context, notes, stylesStack) {
  var result = [];
  pandocInlines.forEach(function(inline) {
    inline = objectToArray(inline);
    var type = inline[0];
    var value = inline[1];
    switch (type) {

      case 'Str':
        // Str String -- Text (string)
        var style = computeStyle(stylesStack);
        result.push([style, value]);
        break;

      case 'Emph':
        // Emph [Inline] -- Emphasized text (list of inlines)
        var inlines = flattenInlines(value, level, context, notes, stylesStack.concat(type));
        result = result.concat(inlines);
        break;

      case 'Strong':
        // Strong [Inline] -- Strongly emphasized text (list of inlines)
        var inlines = flattenInlines(value, level, context, notes, stylesStack.concat(type));
        result = result.concat(inlines);
        break;

      case 'Strikeout':
        // Strikeout [Inline] -- Strikeout text (list of inlines)
        var inlines = flattenInlines(value, level, context, notes, stylesStack);
        result = result.concat(inlines);
        break;

      case 'Superscript':
        // Superscript [Inline] -- Superscripted text (list of inlines)
        var inlines = flattenInlines(value, level, context, notes, stylesStack);
        result = result.concat(inlines);
        break;

      case 'Subscript':
        // Subscript [Inline] -- Subscripted text (list of inlines)
        var inlines = flattenInlines(value, level, context, notes, stylesStack);
        result = result.concat(inlines);
        break;

      case 'SmallCaps':
        // SmallCaps [Inline] -- Small caps text (list of inlines)
        var inlines = flattenInlines(value, level, context, notes, stylesStack);
        result = result.concat(inlines);
        break;

      case 'Quoted':
        // Quoted QuoteType [Inline] -- Quoted text (list of inlines)
        break;

      case 'Cite':
        // Cite [Citation]  [Inline] -- Citation (list of inlines)
        break;

      case 'Code':
        // Code Attr String -- Inline code (literal)
        result.push(['code', value[1]]);
        break;

      case 'Space':
        // Space -- Inter-word space
        result.push(['plain', ' ']);
        break;

      case 'LineBreak':
        // LineBreak -- Hard line break
        result.push(['break', '\n']);
        break;

      case 'Math':
        // Math MathType String -- TeX math (literal)
        var mathType = value[0];
        if (mathType === 'InlineMath') {
          result.push(['math', value[1]]);
        } else {
          assert(mathType === 'DisplayMath');
          var inlines = convertVerbatim(value[1]);
          result.push(['formula', { 'level' : level }, inlines]);
        }
        break;

      case 'RawInline':
        // RawInline Format String -- Raw inline
        break;

      case 'Link':
        // Link [Inline] Target -- Hyperlink: text (list of inlines), target
        var linkRef = (++(context.notesCounter)).toString();
        // TODO: ensure that only one ‘linktext’ is created
        // TODO: handle case of literal url
        var inlines = flattenInlines(value[0], level, context, notes, ['Link']);
        result = result.concat(inlines);
        result.push(['linkref', linkRef]);
        var target = value[1];
        notes.push(['link', { 'level': level }, ['linkref', linkRef], ['url', target[0]] ]);
        break;

      case 'Image':
        // Image [Inline] Target -- Image:  alt text (list of inlines), target
        var target = value[1];
        result.push(['image', { 'level': level }, ['url', target[0]] ]);
        break;

      case 'Note':
        // Note [Block] -- Footnote or endnote
        var noteRef = (++(context.notesCounter)).toString();
        result.push(['noteref', noteRef]);
        var noteBlocks = convertBlocks(value, level, context);
        noteBlocks[0][0] = 'note';
        noteBlocks[0].splice(2, 0, ['noteref', noteRef]);
        noteBlocks.forEach(function (b) { notes.push(b); });
        break;

    }
  });
  return result;
};

var normalizeInlines = function(inlines) {
  var result = [inlines.shift()];
  while (inlines.length > 0) {
    var current = inlines.shift();
    switch (current[0]) {
      case 'image':
      case 'link':
      case 'note':
      case 'formula':
      case 'break':
        result.push(current);
        continue;
    }

    var last = result[result.length-1];
    if (last[0] == current[0] ||
        (current[0] === 'plain' && current[1] === ' ' &&
         inlines.length > 0 && last[0] === inlines[0][0])) {
      // append text
      last[1] += current[1];
    } else {
     result.push(current);
    }
  }
  return result;
};

var computeStyle = function(pandocStyles) {
  if (pandocStyles.length == 0)
    return 'plain';
  switch (pandocStyles[0]) {
    case 'Emph': return 'emph';
    case 'Strong': return 'strong';
    case 'Link': return 'linktext';
    default: return 'plain';
  }
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
