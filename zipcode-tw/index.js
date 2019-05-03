const fs = require('fs')
fs.readFile('(10804)3+2郵遞區號UTF8.txt', 'utf8', (err, data) => {
    if (err) {
        throw err
    }
    const tokens = data.match(/[^\r\n]+/g);
})

exports.printMsg = function () {
    console.log("This is a message from the demo package");
}