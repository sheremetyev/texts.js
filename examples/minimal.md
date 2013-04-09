Minimal Texts.js Sample
=======================

This document shows what syntax must be supported in texts.js to be compatible
with Markdown ([pandoc][pandoc] dialect).

[pandoc]: <http://johnmacfarlane.net/pandoc/>

Headings
========

Subsection Heading
------------------

### Subsubsection

Text Formatting
===============

You can use *emphasis* and **strong** emphasis. Inline `code` will use
monospaced font.

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Code blocks use monospaced font as well and preserve line
breaks
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Math
====

Math formulas can be used inside paragraph like $E=mc^2$ or on a separate line
like the following one.

$$
1+\frac{q^2}{(1-q)}+\frac{q^6}{(1-q)(1-q^2)}+\cdots =
\prod_{j=0}^{\infty}\frac{1}{(1-q^{5j+2})(1-q^{5j+3})},
\quad\quad \text{for $|q|<1$}
$$

Footnotes
=========

Footnotes are placed anywhere[^1] in the source file but appear at the bottom
of the page.

[^1]: Yes, right here.

Hyperlinks
==========

You can add arbitrary hyperlinks. Link [text][1] can differ from it's URL or be
the same as the URL: <http://www.google.com/>.

[1]: <http://www.texts.io/>

You can include e-mail links: <sheremetyev@gmail.com>. Local files can be
[referenced][2] as well.

[2]: <basic.pdf>

Images
======

![](<Texts_Logo.png>)

Tables
======

+-----------+----------+----------+--------------------------------------------+
| Day       | Min Temp | Max Temp | Summary                                    |
+-----------+----------+----------+--------------------------------------------+
| Monday    | 11°C     | 22°C     | A clear day with lots of sunshine. However,|
|           |          |          | the strong breeze will bring down the      |
|           |          |          | temperatures.                              |
+-----------+----------+----------+--------------------------------------------+
| Tuesday   | 9°C      | 19°C     | Cloudy with rain, across many northern     |
|           |          |          | regions. Clear spells across most of       |
|           |          |          | Scotland and Northern Ireland, but rain    |
|           |          |          | reaching the far northwest.                |
+-----------+----------+----------+--------------------------------------------+
| Wednesday | 10°C     | 21°C     | Rain will still linger for the morning.    |
|           |          |          | Conditions will improve by early afternoon |
|           |          |          | and continue throughout the evening.       |
+-----------+----------+----------+--------------------------------------------+

Lists
=====

-   First bulleted item.

-   Second bulleted item.

    -   Subitem.

        -   Subsubitem.

1.  First numbered item.

2.  Second numbered item.

    1.  Subitem.

        1.  Subsubitem.

Quoting
=======

>   Quoted text can include only inline text styles.

>   Headings shouldn’t be used.

--------------------------------------------------------------------------------

Symbol Escaping
===============

No-break space (Unicode U+00A0) will be converted to tilde symbol for TeX.

XeTeX doesn't need TeX ligatures for quotation marks, em-dash and other
typographic symbols—they can be ‘used’ “directly”. Euro symbol can be used for
as less as €10. Ellipsis… in the text should be a Unicode character.

Should TeX ligatures be \`\`used''—they will be printed \<\<as is\>\>.

TeX special symbols are automatically escaped: %, \$, {, }, _, #, &, \\, ~, ^.

HTML entites don't have to be escaped: &, \<, \>.

Future Extensions
=================

-   Definition lists.

-   Titles for images, tables and formulas.

-   Cross-references.

-   Bibliographic citations.

-   Comments.

-   Custom labels for blocks.
