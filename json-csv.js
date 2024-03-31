const Parser = require('papaparse');
const fs = require('fs'); // Include the Node.js file system module

// json to csv
const papaParseConfig = {
    quotes: false, //or array of booleans
    quoteChar: '"',
    escapeChar: '"',
    delimiter: ",",
    header: true,
    newline: "\r\n",
    skipEmptyLines: false, //other option is 'greedy', meaning skip delimiters, quotes, and whitespace.
    columns: null //or array of strings
}


function readAndConvertJsonIntoCsv(inputfileName, outputFilename) {
    fs.readFile(inputfileName, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the input JSON file:', err);
            return;
        }

        try {
            const csvString = Parser.unparse(data, { header: true });
            fs.promises.writeFile(outputFilename, csvString, 'utf8');
            console.log('file converted!');
        } catch {
            console.log('something went wrong!');
        }
    });
}

const inputFileName = 'wiser-usa/new/list-combined-database.json';
const outputFileName = 'wiser-usa/new/list-combined-database.csv';
readAndConvertJsonIntoCsv(inputFileName, outputFileName);