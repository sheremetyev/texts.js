var assert = require('assert');

module.exports = function parse(str) {
  var json = JSON.parse(str);
  var pandocMetadata = json[0];
  var pandocBlocks = json[1];
  var context = { notesCounter: 0 };
  var metadata = convertMetadata(pandocMetadata, context);
  var blocks = convertBlocks(pandocBlocks, 0, context);
  return ['text'].concat(metadata).concat(blocks);
};

var convertMetadata = function(metadata, context) {
  var result = [];

  var title = metadata['docTitle'];
  if (title.length > 0) {
    result = result.concat(convertInlines(title, 0, context));
  }

  var authors = metadata['docAuthors'];
  if (authors.length > 0) {
    authors.forEach(function (author) {
      result = result.concat(convertInlines(author, 0, context));
    });
  }

  var date = metadata['docDate'];
  if (date.length > 0) {
    result = result.concat(convertInlines(date, 0, context));
  }

  return result;
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
        var quotes = convertBlocks(value, level+1, context);
        quotes.forEach(function(block) {
          if (block[0] !== 'quote' && block[0] !== 'link'  && block[0] !== 'note') {
            block[0] = 'quote';
            block[1].level--;
          }
        });
        blocks = blocks.concat(quotes);
        break;

      case 'OrderedList':
        // OrderedList ListAttributes [[Block]] -- Ordered list (attributes and
        // a list of items, each a list of blocks)
        var listBlocks = convertList(value[1], 'numbered', level, context);
        blocks = blocks.concat(listBlocks);
        break;

      case 'BulletList':
        // BulletList [[Block]] --  Bullet list (list of items, each a list of
        // blocks)
        var listBlocks = convertList(value, 'bulleted', level, context);
        blocks = blocks.concat(listBlocks);
        break;

      case 'DefinitionList':
        // DefinitionList [([Inline],[[Block]])] -- Definition list
        // Each list item is a pair consisting of a term (a list of inlines)
        // and one or more definitions (each a list of blocks)
        value.forEach(function(item) {
          var term = item[0];
          var definitions = item[1];
          blocks = blocks.concat(convertInlines(term, level, context));
          blocks = blocks.concat(convertList(definitions, 'bulleted', level, context));
        });
        break;

      case 'Header':
        // Pandoc 1.9:  Header Int [Inline] -- Header - level (integer) and text (inlines)
        // Pandoc 1.10: Header Int Attr [Inline] -- Header - level (integer) and text (inlines)
        var inlines = value[value.length-1]; // should work for both versions
        var textBlocks = convertInlines(inlines, 0, context);
        if (textBlocks.length > 0) {
          textBlocks[0][0] = 'heading';
          textBlocks[0][1].level = Math.min(value[0]-4, -1);
        }
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
        blocks = blocks.concat(convertTable(value[3], value[4], level, context));
        break;

    }
  });
  return blocks;
};

var convertList = function (items, type, level, context) {
  var blocks = [];

  items.forEach(function (item) {
    var itemBlocks = convertBlocks(item, level+1, context);
    if (itemBlocks.length > 0) {
      itemBlocks[0][0] = type;
      itemBlocks[0][1].level = level;
      blocks = blocks.concat(itemBlocks);
    }
  });

  return blocks;
};

var convertTable = function(headers, rows, level, context) {
  var result = convertTableRow(headers, 'bulleted', level, context);
  rows.forEach(function(row) {
    result = result.concat(convertTableRow(row, 'bulleted', level, context));
  });
  return result;
};

var convertTableRow = function(row, context) {
  var blocks = convertList(row, 'col', 2, context);
  blocks[0][0] = 'row';
  blocks[0][1].level = 1;
  return blocks;
};

var convertInlines = function (pandocInlines, level, context) {
  var notes = [];
  var inlines = flattenInlines(pandocInlines, level, context, notes, []);
  var blocks = extractImagesAndFormulas(inlines, level);
  blocks = normalizeBlocks(blocks);
  return blocks.concat(notes);
};

var extractImagesAndFormulas = function(inlines, level) {
  var result = [];
  var current = [];
  inlines.forEach(function (inline) {
    switch (inline[0]) {
      case 'image':
      case 'formula':
        if (current.length > 0)
          result.push(['para', { 'level': level }].concat(current));
        current = [];
        result.push(inline);
        break;
      default:
        current.push(inline);
    }
  });
  if (current.length > 0)
    result.push(['para', { 'level': level }].concat(current));
  return result;
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
        var inlines = flattenInlines(value[1], level, context, notes, stylesStack);
        if (value[0] == 'SingleQuote') {
          result.push(['plain', '‘']);
          result = result.concat(inlines);
          result.push(['plain', '’']);
        } else {
          result.push(['plain', '“']);
          result = result.concat(inlines);
          result.push(['plain', '”']);
        }
        break;

      case 'Cite':
        // Cite [Citation]  [Inline] -- Citation (list of inlines)
        value[0].forEach(function(citation) {
          var id = citation.citationId;
          result.push(['plain', '[@' + id + ']']);
        });
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
          var str = value[1].replace(/\n/g, ' ');
          result.push(['math', str]);
        } else {
          assert(mathType === 'DisplayMath');
          var inlines = convertVerbatim(value[1]);
          result.push(['formula', { 'level' : level }].concat(inlines));
        }
        break;

      case 'RawInline':
        // RawInline Format String -- Raw inline
        break;

      case 'Link':
        // Link [Inline] Target -- Hyperlink: text (list of inlines), target
        var target = value[1];
        var url = target[0];
        var inlines = flattenInlines(value[0], level, context, notes, stylesStack);
        inlines = joinInlinesForLinktext(inlines);
        assert(inlines.length === 1);
        if (inlines[0][1] === url) {
          result.push(['url', url]);
        } else {
          result = result.concat(inlines);
          var linkRef = (++(context.notesCounter)).toString();
          result.push(['linkref', linkRef]);
          notes.push(['link', { 'level': level }, ['linkref', linkRef], ['url', url] ]);
        }
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
        if (noteBlocks.length > 0) {
          noteBlocks[0][0] = 'note';
          noteBlocks[0].splice(2, 0, ['noteref', noteRef]);
          noteBlocks.forEach(function (b) { notes.push(b); });
        } else {
          notes.push([ 'note', { 'level': level }, ['noteref', noteRef] ]);
        }
        break;

    }
  });
  return result;
};

var normalizeBlocks = function(blocks) {
  var result = [];
  blocks.forEach(function(block) {
    if (block[0] !== 'para') {
      result.push(block);
      return;
    }

    var head = [block.shift(), block.shift()];
    var inlines = normalizeInlines(block);

    // block containing only spaces can be ignored
    if (inlines.length === 1 && inlines[0][1].trim().length === 0)
      return;

    result.push(head.concat(inlines));
  });
  return result;
};

var normalizeInlines = function(inlines) {
  var result = [inlines.shift()];
  while (inlines.length > 0) {
    var current = inlines.shift();
    if (current[0] === 'break') {
      result.push(current);
      continue;
    }

    var last = result[result.length-1];
    if (last[0] == current[0] ||
        (current[0] === 'plain' && current[1] === ' ' &&
         inlines.length > 0 && last[0] === inlines[0][0] &&
         last[0] !== 'break')) {
      // append text
      assert(typeof last[1] === 'string');
      last[1] += current[1];
    } else {
     result.push(current);
    }
  }
  return result;
};

var joinInlinesForLinktext = function(inlines) {
  var text = "";
  inlines.forEach(function(inline) {
    switch (inline[0]) {
      case 'image':
      case 'formula':
      case 'break':
        return;
    }
    assert(typeof inline[1] === 'string');
    text += inline[1];
  });
  return [['linktext', text]];
};

var computeStyle = function(pandocStyles) {
  if (pandocStyles.length === 0)
    return 'plain';
  switch (pandocStyles[0]) {
    case 'Emph': return 'emph';
    case 'Strong': return 'strong';
    default: return 'plain';
  }
};

var convertVerbatim = function(pandocString) {
  var lines = pandocString.split('\n');

  // trim empty lines at the beginning and at the end
  while (lines.length > 0 && lines[0].length === 0) {
    lines.splice(0, 1);
  }
  while (lines.length > 0 && lines[lines.length-1].length === 0) {
    lines.splice(lines.length-1, 1);
  }

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
