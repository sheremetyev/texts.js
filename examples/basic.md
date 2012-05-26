[draft]

[title] Texts.js Sample
=======================

[author] Fyodor Sheremetyev
---------------------------

[abstract] Abstract
===================

This document shows what should be possible with texts.js [^1] and XeTeX [^2].

[^1]: <http://textjs.org/>

[^2]: <http://en.wikipedia.org/wiki/XeTeX>

Headings
========

Subsection Heading
------------------

[#somesection] Subsubsection
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Text Formatting
===============

You can use *emphasis* and **strong** emphasis. Inline `code` will use
monospaced font.

[#somecode]
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Code blocks use monospaced font as well and preserve line
breaks
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Math
====

Math formulas can be used inside paragraph like $E=mc^2$ or on a separate line
like the following one.

[#myequation]
$$
1+\frac{q^2}{(1-q)}+\frac{q^6}{(1-q)(1-q^2)}+\cdots =
\prod_{j=0}^{\infty}\frac{1}{(1-q^{5j+2})(1-q^{5j+3})},
\quad\quad \text{for $|q|<1$}
$$

Footnotes
=========

Footnotes are placed inside text [^3] in the TeX source file but appear at the
bottom of the page.

[^3]: Yes right here.

Or you could reference [^4] your footnote or two [^5].

[^4]: And then define it.

[^5]: I mean, both of them.

Cross-references
================

We can refer to Section [#somesection], Equation [#myequation], Figure [#logo]
or Table [#table-example].

Hyperlinks
==========

Cross-references are hyperlinked automatically (try clicking the figure number
above). It is possible to include surrounding text in the link, e.g. Figure
[#logo]—so that link is larger.

And you can add arbitrary hyperlinks of course. Link text [^6] can differ from
it's URL or be the same as the URL: <http://www.google.com/>.

[^6]: <http://www.texts.io/>

You can include e-mail links: <sheremetyev@gmail.com>. Local files can be
referenced [^7]. It is possible to reference [#mylabel] any location in the
document.

[^7]: <basic.pdf>

[#mylabel] For example, this text is referenced in previous paragraph.

Images
======

! [#logo] <Texts_Logo.png>

~ Texts editor logo

Tables
======

[#table-example]
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

~ Simple table

Bibliography
============

You define bibliographic sources at the bottom of the file and use [@lamport94]
[@goossens93] them anywhere in the text.

[@lamport94]: Leslie Lamport, *LaTeX: A Document Preparation System*. Addison
Wesley, Massachusetts, 2nd Edition, 1994.

Lists
=====

* [todo] First bulleted item.

* [done] Second bulleted item.

    * Subitem.

        * Subsubitem.

1. First numbered item.

2. Second numbered item.

    1. Subitem.

        1. Subsubitem.

[ ] Todo item

[x] Done item

First

~ The first item

Second

~ The second item

Third

~ The third etc ...

Quoting
=======

> Quoted text can include only inline text styles.
>
> Headings shouldn’t be used.

Comments
========

Symbol Escaping
===============

No-break space (Unicode U+00A0) will be converted to tilde symbol for TeX.

XeTeX doesn't need TeX ligatures for quotation marks, em-dash and other
typographic symbols—they can be ‘used’ “directly”. Euro symbol can be used for
as less as €10. Ellipsis… in the text should be a Unicode character.

Should TeX ligatures be ``used''—they will be printed \<\<as is\>\>.

TeX special symbols are automatically escaped: %, $, {, }, _, #, &, \\, ~, ^.

Other Features
==============

Document title and author should be defined in a wrapping TeX file, as well
as sepecial markup for abstract, placement of table of contents and
bibliography. Default export intends to produce good quality document with
minimal set of features. Another approach would be to use custom markup in the
document (i.e. labels) and process it during the export stage.

--------------------------------------------------------------------------------
