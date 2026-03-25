const fs = require('fs');
const http = require('http');
const zlib = require('zlib');
const { pipeline } = require('stream');

//todo 1
function readFileChunks() {
    const readStream = fs.createReadStream('./big.txt',
         { encoding: 'utf8', highWaterMark: 1 * 1024 }); 

    readStream.on('data', (chunk) => {
        console.log('Received chunk:', chunk);
    });

    readStream.on('end', () => {
        console.log('Finished reading file.');
        copyContentFile();
    });
}
//todo 2
function copyContentFile() {
    const readStream = fs.createReadStream('./source.txt');
    const writeStream = fs.createWriteStream('./dest.txt');

    readStream.pipe(writeStream);

    writeStream.on('finish', () => {
        console.log('File copied using streams successfully.');

        compressFile();
    });
}
//todo 3
function compressFile() {
    const source = fs.createReadStream('./data.txt');
    const gzip = zlib.createGzip();
    const destination = fs.createWriteStream('./data.txt.gz');

    pipeline(source, gzip, destination, (err) => {
        if (err) {
            console.error('Pipeline failed.', err);
        } else {
            console.log('Pipeline succeeded. File compressed to ./data.txt.gz');
        }
    });
}
readFileChunks();