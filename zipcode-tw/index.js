
const csv = require('csv-parser');
const fs = require('fs');

function startTesting() {
    const testCases = [
        "中山北路六段",
        // "中興三街",
        // "市政北七路",
        // "台北市內湖區瑞光路478巷20號3樓",
        // "內湖區", "瑞光路478巷20號3樓", 
        // "瑞光路478巷", 
        // "20號3樓", 
        // "台北市內湖區瑞光路318號"
    ];
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
    const matchResult = targetAddress.match(/(?<zipcode>(^\d{5}|^\d{3})?)(?<city>\D+[縣市])?(?<district>\D+?(市區|鎮區|鎮市|[鄉鎮市區]))?(?<road>\D+?((路(.段)?)|[街巷]))?(?<others>.+)?/)
    const { groups } = matchResult;
    const { zipcode, city, district, road, others } = groups
    for (let part in groups) {
        switch (part) {
            case "zipcode":
            case "city":
            case "district":
            case "others": {
                let content = groups[part];
                if(content){
                    const replaceMapping = {
                        '-': '之', '~': '之', '台': '臺',
                    }
                    for (let substitution in replaceMapping) {
                        const correctCharacter = replaceMapping[substitution]
                        content.replace(substitution, correctCharacter)
                    }
                }
                break;
            }
            case "road": {
                let content = groups.road;
                if(content){
                    if (content.indexOf("段") !== -1) {
                        const roadNumberMapping = {
                            '一': '１', '二': '２', '三': '３', '四': '４', '五': '５',
                            '六': '６', '七': '７', '八': '８', '九': '９',
                        }
                        for (let substitution in roadNumberMapping) {
                            const correctCharacter = roadNumberMapping[substitution]
                            let test = "123456"
                            // test.replace(substitution, correctCharacter)
                            test.replace("1", "2")
                            console.log({
                                substitution,
                                correctCharacter,
                                test
                            })
                        }
                    }
                    groups.road = content;
                }
                break;
            }
        }
    }
    console.log({
        groups
    })

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