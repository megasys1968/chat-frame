let fs   = require('fs');
let yaml = require('js-yaml');

let inputfile = 'scenario.yaml';
let outputfile = 'public/scenario.json';

let obj = yaml.load(fs.readFileSync(inputfile, {encoding: 'utf-8'}));
fs.writeFileSync(outputfile, JSON.stringify(obj, null, 2));
