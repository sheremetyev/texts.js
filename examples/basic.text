Introduction
============

This document shows what should be possible with [texts.js] and [XeTeX].

  [texts.js]: <http://textjs.org/>

  [XeTeX]: <http://en.wikipedia.org/wiki/XeTeX>

Headings
========

Subsection Heading
------------------

### Subsubsection Heading

  {#sec:somesection}

Text Formatting
===============

You can use *emphasis* and **strong** emphasis. Inline `code`
will use monspaced font.

~~~~~
Code blocks use monospaced font as well and preserve line
breaks
~~~~~

Math
====

Math formulas can be used inside paragraph like $E=mc^2$ or on a separate line
like the following one.

$$
1+\frac{q^2}{(1-q)}+\frac{q^6}{(1-q)(1-q^2)}+\cdots =
\prod_{j=0}^{\infty}\frac{1}{(1-q^{5j+2})(1-q^{5j+3})},
\quad\quad \text{for $|q|<1$}
$$

  {#eq:myequation}

Footnotes
=========

Footnotes are placed inside text^[Yes right here.] in the TeX source
file but appear at the bottom of the page.

Or you could reference[^2] your footnote or two[^3].

  [^2]: And then define it.

  [^3]: I mean, both of them.

Cross-references
================

We can refer to Section [#sec:somesection], Equation [eq:myequation],
Figure [#fig:logo] or Table [#tab:example].

Hyperlinks
==========

Cross-references are hyperlinked automatically (try clicking the figure number
above). It is possible to include surrounding text in the link, e.g.
[Figure ][#fig:logo]—so that link is larger.

And you can add arbitrary hyperlinks of course.
Link [text](<http://www.texts.io/>) can differ from it's URL or be the same
as the URL: <http://www.google.com/>.

You can include e-mail links: <sheremetyev@gmail.com>. Local files can be
[referenced](<basic.pdf>). It is possible to [reference][#mylabel] any
location in the document.

For example, this text is referenced in previous paragraph.

  {#mylabel}

Images
======

![](<Texts_Logo.png>)

  {#fig:logo}

  ~ Texts editor logo

Tables
======

--------- -------- -------- ---------------------------------------------------
Day       Min Temp Max Temp Summary

Monday    11C      22C      A clear day with lots of sunshine.
                            However, the strong breeze will bring down the
                            temperatures.

Tuesday   9C       19C      Cloudy with rain, across many northern regions.
                            Clear spells across most of Scotland and Northern
                            Ireland, but rain reaching the far northwest.

Wednesday 10C      21C      Rain will still linger for the morning. Conditions
                            will improve by early afternoon and continue
                            throughout the evening.
--------------------------------------------------------------------------------

  {#tab:example}

  ~ Simple table

Bibliography
============

You define bibliographic sources at the bottom of the file and
use [@lamport94, @goossens93] them anywhere in the text.

Lists
=====

  * First bulleted item.

  * Second bulleted item.

      * Subitem.

          * Subsubitem.

 1. First numbered item.

 2. Second numbered item.

     1. Subitem.

         1. Subsubitem.

First

  ~ The first item

Second

  ~ The second item

Third

  ~ The third etc ...

Quoting
=======

  > Quoted text can include other text styles.

  > # But headings shouldn’t use default commands.

Comments
========

Symbol Escaping
===============

No-break space (Unicode U+00A0) will be converted to tilde symbol for TeX.

XeTeX doesn't need TeX ligatures for quotation marks, em-dash and other
typographic symbols—they can be ‘used’ “directly”. Euro symbol can be used for
as less as €10. Ellipsis… in the text should be a Unicode character.

Should TeX ligatures be ``used''—they will be printed \<\<as is\>\>.

TeX special symbols are automatically escaped: %, $, {, }, _, #,
&, \\, ~, ^.

Other Features
==============

Document title and author should be defined in a wrapping TeX file, as well
as sepecial markup for abstract, placement of table of contents and
bibliography. Default export intends to produce good quality document with
minimal set of features. Another approach would be to use custom markup in the
document (i.e. labels) and process it during the export stage.

[@lamport94]: Leslie Lamport, *LaTeX: A Document Preparation System*.
Addison Wesley, Massachusetts, 2nd Edition, 1994.

--------------------------------------------------------------------------------
