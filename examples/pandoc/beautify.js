var fs = require('fs');

var text = fs.readFileSync('README.json', 'utf8');
var json = JSON.parse(text);
text = JSON.stringify(json, null, 2);
fs.writeFileSync('README.1.json', text, 'utf8');
