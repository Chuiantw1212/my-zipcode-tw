
const csv = require('csv-parser');
const fs = require('fs');

function startTesting() {
    const testCases = ["台北市", "台北市內湖區瑞光路478巷20號3樓", "內湖區", "瑞光路478巷20號3樓", "瑞光路478巷", "20號3樓", "台北市內湖區瑞光路318號"];
    testCases.forEach(testCase => {
        const testResult = getPostCode(testCase);
        console.log({
            testCase,
            testResult
        })
    })
};

function readCSVfromDisk() {
    const postGroup = [];
    return new Promise((resolve) => {
        fs.createReadStream('./3+2碼郵遞區號108-04.csv')
            .pipe(csv())
            .on('data', (row) => {
                /**
                 * {
                 *   '郵遞區號': '10849',
                 *   '縣市名稱': '臺北市',
                 *   '鄉鎮市區': '萬華區',
                 *   '原始路名': '桂林路',
                 *   '投遞範圍': '雙  62號以下' }
                 */
                postGroup.push(row);
            })
            .on('end', () => {
                console.log('CSV file successfully processed');
                resolve(postGroup)
            });
    })
}

let allAddressOfTaiwan = [];
async function initialize() {
    allAddressOfTaiwan = await readCSVfromDisk();
    await startTesting();
}
initialize();

function getPostCode(targetAddress) {
    const TO_REPLACE_MAP = {
        '-': '之', '~': '之', '台': '臺',
        '１': '1', '２': '2', '３': '3', '４': '4', '５': '5',
        '６': '6', '７': '7', '８': '8', '９': '9', '０': '0',
        '一': '1', '二': '2', '三': '3', '四': '4', '五': '5',
        '六': '6', '七': '7', '八': '8', '九': '9',
    }
    let correctAddress = targetAddress
    for (let substitution in TO_REPLACE_MAP) {
        const correctCharacter = TO_REPLACE_MAP[substitution]
        correctAddress = correctAddress.replace(substitution, correctCharacter)
    }
    const matchResult = correctAddress.match(/(?<zipcode>(^\d{5}|^\d{3})?)(?<city>\D+[縣市])?(?<district>\D+?(市區|鎮區|鎮市|[鄉鎮市區]))?(?<road>\D+?[段路巷弄號樓])?(?<others>.+)?/)
    const { groups } = matchResult;
    const { zipcode, city, district, road, others } = groups
    if (road) {
        const candidateAddress = allAddressOfTaiwan.find(address => {
            return address['原始路名'] === road
        })
        if (candidateAddress) {
            return Object.assign({}, {
                zipcode: candidateAddress['郵遞區號'],
                city: candidateAddress['縣市名稱'],
                district: candidateAddress['鄉鎮市區'],
                road: candidateAddress['原始路名'],
            })
        }
    }
    if (district) {
        const candidateAddress = allAddressOfTaiwan.find(address => {
            return address['鄉鎮市區'] === district
        })
        if (candidateAddress) {
            return Object.assign({}, {
                zipcode: candidateAddress['郵遞區號'].slice(0, 3),
                city: candidateAddress['縣市名稱'],
                district: candidateAddress['鄉鎮市區'],
            })
        }
    } else if (city) {
        const candidateAddress = allAddressOfTaiwan.find(address => {
            return address['縣市名稱'] === city
        })
        if (candidateAddress) {
            return Object.assign({}, {
                zipcode: candidateAddress['郵遞區號'].slice(0, 1),
                city: candidateAddress['縣市名稱'],
            })
        }
    } else if (zipcode) {
        const candidateAddress = allAddressOfTaiwan.find(address => {
            return address['郵遞區號'] === zipcode
        })
        if (candidateAddress) {
            return Object.assign({}, {
                zipcode: candidateAddress['郵遞區號'],
                city: candidateAddress['縣市名稱'],
                district: candidateAddress['鄉鎮市區'],
            })
        }
    }
}

module.exports = getPostCode