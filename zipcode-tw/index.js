
const csv = require('csv-parser');
const fs = require('fs');
// const path = require('path')
function startTesting() {
    const address = "台北市"
    const zipcode = getPostCode(address);
    console.log({
        zipcode
    })
};

function readCSVfromDisk() {
    const postGroup = [];
    return new Promise((resolve) => {
        fs.createReadStream('3+2碼郵遞區號108-04.csv')
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
    // console.log(allAddressOfTaiwan.length);
    await startTesting();
}
initialize();

function getPostCode(targetAddress) {
    const addressTokenGroup = targetAddress.match(/(?<zipcode>(^\d{5}|^\d{3})?)(?<city>\D+[縣市])(?<district>\D+?(市區|鎮區|鎮市|[鄉鎮市區]))(?<others>.+)/)
    const { zipcode, city, district, others } = addressTokenGroup;
    if (district) {
        const candidateAddress = allAddressOfTaiwan.find(address => {
            return address['鄉鎮市區'] === district
        })
        if (candidateAddress) {
            return Object.assign({}, {
                zipcode: candidateAddress['郵遞區號'],
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
                zipcode: candidateAddress['郵遞區號'].slice(0, 3),
                city: candidateAddress['縣市名稱'],
                district: candidateAddress['鄉鎮市區'],
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