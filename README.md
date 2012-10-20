texts.js
========

**texts.js** is a JavaScript library (for Node and for browser) that implements
conversion between various “rich” text formats. It does the conversion via
universal text model (TextJSON, see below) that is rich enough for most of the
texts, yet simple.

Current version of texts.js supports reading of Text (Markdown subset), Pandoc
JSON and writing of Text, HTML5, XeLaTeX and Pandoc JSON formats.

Usage
-----

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
$ npm install texts
$ texts --from text --to html5
*Hello* world!
^D
<p><em>Hello<em> world!</p>
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

For information on options use the following command.

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
texts --help
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Text Format
-----------

Text format produced and recognized by texts.js is similar to Markdown but is
not tied to the generation of HTML. The purpose of Text format to represent a
structure that can be published in any text format. The major differences from
Markdown are:

-   no support for inline HTML,

-   explicit format definition (in form of PEG grammar),

-   one variation of markup for each style.

The following paragraph styles are supported:

-   headings,

-   bulleted and numbered lists,

-   quotations,

-   verbatim (code) blocks,

-   math formulas,

-   images,

-   footnotes,

-   hyperlinks.

There is also intention to make Text format a bit more rational. For example,
indentation in Markdown can represent either structure (second paragraph in a
list) or style (verbatim block). In Text format indentation represents text
structure only.

Files in the Text format can be edited in any plain text editor or in a WYSIWYM
editor [Texts][1].

[1]: <http://www.texts.io/>

TextJSON
--------

TextJSON is the format of the universal text model in **text.js**. It is based
on [JsonML][2], format for structured data. Any TextJSON document is a valid
JSON document and thus can be easily produced or consumed in any programming
language.

[2]: <http://www.jsonml.org/>

Each TextJSON object is a 2-level structure—an array of blocks, where each block
is an array of spans. Above them is a formal root element “text”. Each block has
attribute “level” with zero being the level of the main text, positive levels
for nested elements and negative levels for headings.

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
$ texts --from text --to json
*Hello* world!
^D
["text",

  ["para", { "level": 0 },
    ["emph", "Hello"],
    ["plain", " world!"]
  ]

]
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
