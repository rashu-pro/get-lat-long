const fs = require('fs'); // Include the Node.js file system module

const updatedJsonFileName = 'islamic-school-directory-data-updated.json';
const swapedDataJsonFileName = 'islamic-school-directory-swaped-data.json';

const googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyCRIIew-eQp2QjI5mRLFOE-qoUnl-qKC38' // Replace with your actual Google Maps API key
});

async function getAddress(address, supportingAddressParameter, count) {
  let parameter = supportingAddressParameter[count];
  let addressQuery = address + ',' + parameter;
  let formattedAddress = await geocodeAddress(addressQuery);
  if (formattedAddress.length < 1) {
    count = count + 1;
    getAddress(address, supportingAddressParameter, count);
    return;
  }

  return formattedAddress;
}

// Function to geocode addresses and update the array
function geocodeAddressesAndSaveToJson(data) {
  const promises = data.map(async (school) => {
    const address = `${school["SCHOOL_ADDRESS"]}, ${school["ZIP_CODE"]}`;

    // Geocode the address
    // const response = await geocodeAddress(address);
    let zipCode = String(school['ZIP_CODE']);
    if (zipCode.length < 5) {
      zipCode = '0' + zipCode;
    }
    const addressParameter = [zipCode, school['CITY'], school['STATE']];
    const response = await getAddress(school['SCHOOL_ADDRESS'], addressParameter, 0);

    if (response && response[0]) {
      // Update latitude and longitude in the original data
      school["LATITUDE"] = response[0].geometry.location.lat;
      school["LONGITUDE"] = response[0].geometry.location.lng;
      school["SCHOOL_ADDRESS"] = response[0].formatted_address.replace(/, USA$/, '');
    }

    return school;
  });

  // Wait for all promises to complete
  Promise.all(promises)
    .then((updatedData) => {
      // Save the updated data to a JSON file
      saveToJsonFile(updatedData, 'sheet1-fo-2-updated.json');
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

// Function to geocode an address
function geocodeAddress(address) {
  return new Promise((resolve, reject) => {
    googleMapsClient.geocode({
      address: address
    }, (err, response) => {
      if (!err) {
        resolve(response.json.results);
      } else {
        reject(err);
      }
    });
  });
}

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

// Call the function to start geocoding and saving to JSON
function formatTheAddress() {
  fs.readFile('sheet1-of-2.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the input JSON file:', err);
      return;
    }

    try {
      const schoolDirectoryData = JSON.parse(data);
      geocodeAddressesAndSaveToJson(schoolDirectoryData);
    } catch {

    }
  });
}
// formatTheAddress();


// Swaps grade brackets value into zip code so that I can show it into popup template into school directory
function swapData() {
  fs.readFile('sheet1-fo-2-updated.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the input JSON file:', err);
      return;
    }

    try {
      const schoolDirectoryData = JSON.parse(data);

      schoolDirectoryData.map(school => {
        school['ZIP_CODE'] = school['GRADE_BRACKETS'];
      })
      saveToJsonFile(schoolDirectoryData, 'sheet1-fo-2-swaped.json');
    } catch {

    }
  });
}
// swapData();

// Fixes object id duplicate entry
function objecIdDupicateEntryFixes() {
  fs.readFile('islamic-school-directory-swaped-data.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the input JSON file:', err);
      return;
    }

    try {
      const schoolDirectoryData = JSON.parse(data);

      let counter = 1;
      schoolDirectoryData.map(school => {
        school['OBJECTID'] = counter;
        school['FID'] = counter;
        counter++;
      })
      console.log('total schools: ', schoolDirectoryData.length)

      saveToJsonFile(schoolDirectoryData, 'islamic-school-directory-swaped-data.json');
    } catch {

    }
  });
}
// objecIdDupicateEntryFixes();

// Check the object which don't have latitude
function haveLatitude(fileName) {
  fs.readFile(fileName, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the input JSON file:', err);
      return;
    }

    try {
      const schoolDirectoryData = JSON.parse(data);
      const inCompletedObjectIds = [];

      let counter = 1;
      schoolDirectoryData.map(school => {
        if (!school['LATITUDE']) {
          inCompletedObjectIds.push(school['OBJECTID'])
        }
      })
      console.log('incompleted objects: ', inCompletedObjectIds)

      // saveToJsonFile(schoolDirectoryData, fileName);
    } catch {

    }
  });
}
// haveLatitude('sheet1-fo-2-swaped.json');

// Purify phone number (only keep one phone number)
function phoneNumberPurify(fileName) {
  fs.readFile(fileName, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the input JSON file:', err);
      return;
    }

    try {
      let schoolDirectoryData = JSON.parse(data);

      schoolDirectoryData = schoolDirectoryData.map(item => {
        const firstPhoneNumber = item.PHONE.split('\n')[0];
        const firstEmail = item.EMAIL_ADDRESS.split('\n')[0];
        const firstHeadOfSchool = item.HEAD_OF_SCHOOL.split('\n')[0];

        return {
          ...item,
          PHONE: firstPhoneNumber,
          EMAIL_ADDRESS: firstEmail,
          HEAD_OF_SCHOOL: firstHeadOfSchool
        };
      });

      saveToJsonFile(schoolDirectoryData, fileName);
    } catch {

    }
  });
}
// phoneNumberPurify('islamic-school-directory-data-updated.json');
// phoneNumberPurify('islamic-school-directory-swaped-data.json');

// Replace invalid webaddress
function invalidWeaddress(fileName) {
  fs.readFile(fileName, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the input JSON file:', err);
      return;
    }

    try {
      let schoolDirectoryData = JSON.parse(data);

      // Iterate through the array and validate the WEBSITE and keep only one email
      schoolDirectoryData = schoolDirectoryData.map(item => {
        // Validate and clean the WEBSITE
        if (item.WEBSITE) {
          const website = item.WEBSITE.trim(); // Remove leading/trailing whitespace
          if (isValidWebsite(website)) {
            item.WEBSITE = website; // Update the cleaned website URL
          } else {
            item.WEBSITE = ''; // Set to null if invalid
          }
        } else {
          item.WEBSITE = '';
        }

        return item;
      });

      saveToJsonFile(schoolDirectoryData, fileName);
    } catch {

    }
  });
}
// Function to validate a website URL
function isValidWebsite(url) {
  // Regular expression for basic URL validation
  const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9.-]+(\.[a-zA-Z]{2,})+)(\/[a-zA-Z0-9._-]*)*\/?$/;
  return urlPattern.test(url);
}

// invalidWeaddress('islamic-school-directory-data-updated.json');
// invalidWeaddress('islamic-school-directory-swaped-data.json');


// Replace '\n' from features with ','
function replaceSlashNWithCommaInFeatures(fileName) {
  fs.readFile(fileName, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the input JSON file:', err);
      return;
    }

    try {
      let schoolDirectoryData = JSON.parse(data);

      // Iterate through the array and replace '\n' with ','
      schoolDirectoryData = schoolDirectoryData.map(item => {
        if (item.FEATURES) {
          item.FEATURES = item.FEATURES.replace(/\n/g, ',');
        }
        return item;
      });

      saveToJsonFile(schoolDirectoryData, fileName);
    } catch {

    }
  });
}

// replaceSlashNWithCommaInFeatures('islamic-school-directory-data-updated.json');
// replaceSlashNWithCommaInFeatures('islamic-school-directory-swaped-data.json');

// Replace trailing ',' from the features property from the school object
function replacTrailingCommaFromThePropertyValue(fileName){
  fs.readFile(fileName, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the input JSON file:', err);
      return;
    }

    try {
      let schoolDirectoryData = JSON.parse(data);

      // Iterate through the array and remove trailing ','
      schoolDirectoryData = schoolDirectoryData.map(item => {
        if (item.FEATURES.endsWith(',')) {
          item.FEATURES = item.FEATURES.slice(0, -1);
        }
        return item;
      });

      saveToJsonFile(schoolDirectoryData, fileName);
    } catch {

    }
  });
}

// replacTrailingCommaFromThePropertyValue(updatedJsonFileName);
// replacTrailingCommaFromThePropertyValue(swapedDataJsonFileName);

// Add N/A if theres no data available for a property of school object
function replaceNothingWithNA(fileName){
  fs.readFile(fileName, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the input JSON file:', err);
      return;
    }

    try {
      let schoolDirectoryData = JSON.parse(data);

      // Add N/A IF THERES NO DATA AVAILABLE
      schoolDirectoryData.map(item => {
        // if(item.FACEBOOK === 'N/A') item.FACEBOOK = '';
        // if(item.TWITER === 'N/A') item.TWITER = '';
        // if(item.INSTAGRAM === 'N/A') item.INSTAGRAM = '';
        // if(item.YOUTUBE === 'N/A') item.YOUTUBE = '';
        // if(item.LINKEDIN === 'N/A') item.LINKEDIN = '';
        // if(item.FLICKR === 'N/A') item.FLICKR = '';
        // if(item.SCHOOL_SERVICES_PROGRAMS === 'N/A') item.SCHOOL_SERVICES_PROGRAMS = '';


        // return item;
        if(item.GRADE_BRACKETS === ''){
          item.GRADE_BRACKETS = "N/A";
        }

        if(item.HEAD_OF_SCHOOL === ''){
          item.HEAD_OF_SCHOOL = "N/A";
        }

        if(item.TUITION_RANGE === ''){
          item.TUITION_RANGE = "N/A";
        }

        if(item.HIFDH_PROGRAM === ''){
          item.HIFDH_PROGRAM = "N/A";
        }

        if(item.ZIP_CODE === ''){
          item.ZIP_CODE = "N/A";
        }
      });

      saveToJsonFile(schoolDirectoryData, fileName);
    } catch {

    }
  });
}
// replaceNothingWithNA(swapedDataJsonFileName);
// replaceNothingWithNA(updatedJsonFileName);
// replaceNothingWithNA('sheet1-fo-2-updated.json');
// replaceNothingWithNA('sheet1-fo-2-swaped.json');

//Check two array to find if there's any matched entry
function matchTwoList(sheet1, sheet2){
  fs.readFile(sheet1, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the input JSON file:', err);
      return;
    }

    try {
      let schoolDirectoryDataSheet1 = JSON.parse(data);
      let sheet1NameList = [];
      schoolDirectoryDataSheet1.map(item => {
        sheet1NameList.push(item.SCHOOL_NAME);
      })
      // console.log(sheet1NameList);

      fs.readFile(sheet2, 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading the input JSON file:', err);
          return;
        }

        try {
          let schoolDirectoryDataSheet2 = JSON.parse(data);
          let sheet2NameList = [];
          schoolDirectoryDataSheet2.map(item => {
            sheet2NameList.push(item.SCHOOL_NAME);
          })

          let matchedItem = findMatchingItems(sheet1NameList, sheet2NameList);
          console.log(matchedItem);



          // saveToJsonFile(schoolDirectoryData, fileName);
        } catch {

        }
      });


      // saveToJsonFile(schoolDirectoryData, fileName);
    } catch {

    }
  });
}

function findMatchingItems(arr1, arr2) {
  return arr1.filter(item => arr2.includes(item));
}
// matchTwoList('isla-school-directory-sheet1.json', 'islamic-school-directory-data-updated.json');

// Get the duplicates item
function duplicateItems(fileName){
  fs.readFile(fileName, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the input JSON file:', err);
      return;
    }

    try {
      let schoolDirectoryData = JSON.parse(data);
      let itemArray = [];
      schoolDirectoryData.map(item => {
        itemArray.push(item.ID);
      })
      const duplicatesZipCode = findDuplicates(itemArray);
      console.log(duplicatesZipCode);
    } catch {

    }
  });
}

function findDuplicates(arr) {
  const duplicates = [];
  const uniqueValues = [];

  for (let i = 0; i < arr.length; i++) {
      const value = arr[i];

      if (uniqueValues.includes(value)) {
          if (!duplicates.includes(value)) {
              duplicates.push(value);
          }
      } else {
          uniqueValues.push(value);
      }
  }

  return duplicates;
}
// duplicateItems('full-list-to-include-in-footer.json');
// duplicateItems('exported-list-isla.masjidsolutions.net.json');
duplicateItems('exported-list-theisla.org-uniqueid.json');

// fix the object id for sheet 1
function fixObjectId(fileName){
  fs.readFile(fileName, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the input JSON file:', err);
      return;
    }

    try {
      let schoolDirectoryData = JSON.parse(data);
      let startingObject = 215;
      schoolDirectoryData.map(item => {
        item.OBJECTID = startingObject;
        item.FID = startingObject;
        startingObject++;
      })

      saveToJsonFile(schoolDirectoryData, fileName);
    } catch {

    }
  });
}
// fixObjectId('sheet1-fo-2-updated.json');

// Append service and programs into features for sheet 1
function appendServiceAndProgramsIntoFeatures(fileName){
  fs.readFile(fileName, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the input JSON file:', err);
      return;
    }

    try {
      let schoolDirectoryData = JSON.parse(data);
      schoolDirectoryData.map(item => {
        if(item.FEATURES){
          item.FEATURES = item.FEATURES + ', ' + item.SCHOOL_SERVICES_PROGRAMS;
        }
        item.SCHOOL_SERVICES_PROGRAMS = '';
      })

      saveToJsonFile(schoolDirectoryData, fileName);
    } catch {

    }
  });
}
// appendServiceAndProgramsIntoFeatures('sheet1-fo-2-updated.json');

// Total count
function totalCount(fileName){
  fs.readFile(fileName, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the input JSON file:', err);
      return;
    }

    try {
      let schoolDirectoryData = JSON.parse(data);

      console.log('total schools: ', schoolDirectoryData.length);
    } catch {

    }
  });
}

// totalCount('exported-list-theisla.org.json');


