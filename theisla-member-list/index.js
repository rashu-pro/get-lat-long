const fs = require('fs');
const Parser = require('papaparse');

const inputFileName = 'member-list.json';
const outputFileName = 'member-list-updated.json';

// getMemberRegisteredByTheYear(inputFileName);

// const formattedList = formatTheData(inputFileName, outputFileName);

fs.readFile(outputFileName, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading the input JSON file:', err);
        return;
    }

    try {
        const list = JSON.parse(data);

        // Assuming your data array is named 'dataArray'
        let membershipCounts = countMembershipLevels(list);

        console.log(membershipCounts);
    } catch {

    }
});


// Function to save data to a JSON file
function saveToJsonFile(data, fileName) {
    fs.writeFile(fileName, JSON.stringify(data, null, 4), (err) => {
        if (err) {
            console.error('Error writing to JSON file:', err);
        } else {
            console.log(`Data saved to ${fileName}`);
        }
    });
}

function formatTheData(inputFile, outputFile) {
    fs.readFile(inputFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the input JSON file:', err);
            return;
        }

        try {
            const list = JSON.parse(data);
            const formattedList = [];

            list.map(obj => {
                const membershipRenewal = obj.membership == 'Individual (2 Year)' ? 'Per 2 years' : 'Per year';
                const object = {
                    Username: obj.username,
                    FirstName: obj.firstname,
                    LastName: obj.lastname,
                    Email: obj.email,
                    School: obj.school_org,
                    Joined: obj.joined,
                    Expires: obj.expires,
                    MembershipLevel: obj.membership,
                    Fee: obj.fee,
                    MembershipRenewal: membershipRenewal,
                }
                formattedList.push(object);
            })

            saveToJsonFile(formattedList, outputFile);
            return formattedList;
        } catch {

        }
    });
}

//Member registered by year
function getMemberRegisteredByTheYear(inputFile) {
    fs.readFile(inputFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the input JSON file:', err);
            return;
        }

        try {
            const list = JSON.parse(data);

            const dataYears = [
                {
                    name: '2016',
                    startDate: '2016-01-01',
                    endDate: '2016-12-31'
                },
                {
                    name: '2017',
                    startDate: '2017-01-01',
                    endDate: '2017-12-31'
                },
                {
                    name: '2018',
                    startDate: '2018-01-01',
                    endDate: '2018-12-31'
                },
                {
                    name: '2019',
                    startDate: '2019-01-01',
                    endDate: '2019-12-31'
                },
                {
                    name: '2020',
                    startDate: '2020-01-01',
                    endDate: '2020-12-31'
                },
                {
                    name: '2021',
                    startDate: '2021-01-01',
                    endDate: '2021-12-31'
                },
                {
                    name: '2022',
                    startDate: '2022-01-01',
                    endDate: '2022-12-31'
                },
                {
                    name: '2023',
                    startDate: '2023-01-01',
                    endDate: '2023-12-31'
                }
            ];
            const memberByYear = [];

            dataYears.map(obj => {
                const dataObject = [];
                const filteredData = filterObjectsByDate(list, obj.startDate, obj.endDate);

                dataObject.name = obj.name;
                dataObject.memberCount = filteredData.length;
                memberByYear.push(dataObject);
            });

            console.log(memberByYear);
        } catch {

        }
    });
}

// filter object by year
function filterObjectsByDate(data, startDate, endDate) {
    const filteredObjects = data.filter(obj => {
        const joinedDate = new Date(obj.joined);
        return joinedDate >= new Date(startDate) && joinedDate <= new Date(endDate);
    });
    return filteredObjects;
}

function countMembershipLevels(dataArray) {
    // Create an object to store the counts
    let levelCounts = {};

    // Iterate through the array
    dataArray.forEach(item => {
        // Extract the membership level
        let membershipLevel = item.MembershipLevel;

        // If the level is not in the counts object, initialize it to 1, otherwise increment
        levelCounts[membershipLevel] = (levelCounts[membershipLevel] || 0) + 1;
    });

    let sortedArray = Object.entries(levelCounts);
    sortedArray.sort((a, b) => b[1] - a[1]);

    return sortedArray;
}


