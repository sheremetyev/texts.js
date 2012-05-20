var Zip = require('node-zip');

module.exports = function formatText(text, options) {
  var contentTypes =
'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
'  <Default Extension="rels"' +
'    ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
'  <Default Extension="xml"' +
'    ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
'</Types>';

  var relationship =
'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
'  <Relationship Id="rId1"' +
'    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"' +
'    Target="document.xml"/>'+
'</Relationships>';

  var documentContent =
'<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
'  <w:body>' +
'    <w:p>' +
'      <w:r>' +
'          <w:t>Hello, world!</w:t>' +
'      </w:r>' +
'    </w:p>' +
'  </w:body>' +
'</w:document>';

  var zip = new Zip();
  zip.file('[Content_Types].xml', contentTypes);
  zip.file('_rels/.rels', relationship);
  zip.file('document.xml', documentContent);

  data = zip.generate({ base64: false });
  return decode(data);
}

function decode(data) {
  // JSZip returns utf8 string where each char represents a byte
  var buffer = new Buffer(data.length);
  for (var c = 0; c < data.length; c++)
    buffer.writeUInt8(data.charCodeAt(c), c);
  return buffer;
}
