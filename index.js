const Parser = require('papaparse');
const fs = require('fs'); // Include the Node.js file system module

const updatedJsonFileName = 'islamic-school-directory-data-updated.json';
const swapedDataJsonFileName = 'islamic-school-directory-swaped-data.json';

const googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyCRIIew-eQp2QjI5mRLFOE-qoUnl-qKC38'
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
function geocodeAddressesAndSaveToJson(data, outputFilename) {
  const promises = data.map(async (school) => {
    const address = `${school["address"]}, ${school["zip_code"]}`;

    // Geocode the address
    // const response = await geocodeAddress(address);
    let zipCode = String(school['zip_code']);
    if (zipCode.length < 5) {
      zipCode = '0' + zipCode;
    }
    const addressParameter = [zipCode, school['city'], school['state']];
    const response = await getAddress(school['address'], addressParameter, 0);

    if (response && response[0]) {
      // Update latitude and longitude in the original data
      school["latitude"] = response[0].geometry.location.lat;
      school["longitude"] = response[0].geometry.location.lng;
      school["address"] = response[0].formatted_address.replace(/, USA$/, '');
    }

    return school;
  });

  // Wait for all promises to complete
  Promise.all(promises)
    .then((updatedData) => {
      // Save the updated data to a JSON file
      saveToJsonFile(updatedData, outputFilename);
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
function formatTheAddress(inputfileName, outputFilename) {
  fs.readFile(inputfileName, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the input JSON file:', err);
      return;
    }

    try {
      const schoolDirectoryData = JSON.parse(data);
      geocodeAddressesAndSaveToJson(schoolDirectoryData, outputFilename);
    } catch {

    }
  });
}
// formatTheAddress('wiser-usa/new/weekend-school-in-USA-updated.json', 'wiser-usa/new/weekend-school-in-USA-updated.json');


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
        const firstPhoneNumber = extractFirstItem(item.phone.split('\n')[0], ',');
        const firstEmail = extractFirstItem(item.EMAIL_ADDRESS.split('\n')[0], ',');
        const role = extractFirstItem(item.role.split('\n')[0], ',');
        const contactPerson = extractFirstItem(item.CONTACT_PERSON.split('\n')[0], ',');

        // const firstHeadOfSchool = item.HEAD_OF_SCHOOL.split('\n')[0];

        return {
          ...item,
          phone: firstPhoneNumber,
          EMAIL_ADDRESS: firstEmail,
          role: role,
          CONTACT_PERSON: contactPerson
        };
      });

      saveToJsonFile(schoolDirectoryData, fileName);
    } catch {

    }
  });
}
// phoneNumberPurify('islamic-school-directory-wiserusa-formatted.json');

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
function replacTrailingCommaFromThePropertyValue(fileName) {
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
function replaceNothingWithNA(fileName) {
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
        if (item.GRADE_BRACKETS === '') {
          item.GRADE_BRACKETS = "N/A";
        }

        if (item.HEAD_OF_SCHOOL === '') {
          item.HEAD_OF_SCHOOL = "N/A";
        }

        if (item.TUITION_RANGE === '') {
          item.TUITION_RANGE = "N/A";
        }

        if (item.HIFDH_PROGRAM === '') {
          item.HIFDH_PROGRAM = "N/A";
        }

        if (item.ZIP_CODE === '') {
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
function matchTwoList(sheet1, sheet2) {
  fs.readFile(sheet1, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the input JSON file:', err);
      return;
    }

    try {
      let schoolDirectoryDataSheet1 = JSON.parse(data);
      let sheet1NameList = [];
      schoolDirectoryDataSheet1.map(item => {
        sheet1NameList.push(item.latitude);
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
            sheet2NameList.push(item.latitude);
          })

          let matchedItem = findMatchingItems(sheet1NameList, sheet2NameList);
          console.log('total matched item: ', matchedItem.length);
          console.log(matchedItem);

          // saveToJsonFile(schoolDirectoryData, fileName);

          /*
          // remove the matched item from the new list
          const filteredArray = schoolDirectoryDataSheet2.filter(obj => !matchedItem.includes(obj.latitude));
          console.log('total item: ', filteredArray.length);
          saveToJsonFile(filteredArray, 'wiser-usa/new/list-without-existing.json');
          */

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
// matchTwoList('wiser-usa/new/weekend-school-in-USA-updated.json', 'wiser-usa/database/islamic-school-directory-wiserusa-formatted_for_database.json');

// Get the duplicates item
function duplicateItems(fileName) {
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
// duplicateItems('exported-list-theisla.org-uniqueid.json');

// fix the object id for sheet 1
function fixObjectId(fileName) {
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
function appendServiceAndProgramsIntoFeatures(fileName) {
  fs.readFile(fileName, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the input JSON file:', err);
      return;
    }

    try {
      let schoolDirectoryData = JSON.parse(data);
      schoolDirectoryData.map(item => {
        if (item.FEATURES) {
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
function totalCount(fileName) {
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

function replacTrailingComma(fileName, propertyName) {
  fs.readFile(fileName, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the input JSON file:', err);
      return;
    }

    try {
      let schoolDirectoryData = JSON.parse(data);

      // Iterate through the array and remove trailing ','
      schoolDirectoryData = schoolDirectoryData.map(item => {
        const currentProperty = item[propertyName].trim();
        if (currentProperty.endsWith(',')) {
          item[propertyName] = item[propertyName].slice(0, -1);
        }
        return item;
      });

      saveToJsonFile(schoolDirectoryData, fileName);
    } catch {

    }
  });
}
// replacTrailingComma('islamic-school-directory-wiserusa-formatted.json','phone');

function extractFirstItem(inputString, splitSign) {
  const numbers = inputString.split(splitSign).map(item => item.trim()); // Split the string into an array
  return numbers[0]; // Return the first element
}

// readAndConvertJsonIntoCsv('islamic-school-directory-wiserusa-formatted.json', 'islamic-school-directory-data-1692683674579.csv');

// Generates UUID
function generateUUID() {
  let uuid = '', i, random;
  for (i = 0; i < 32; i++) {
    random = (Math.random() * 16) | 0;
    if (i === 8 || i === 12 || i === 16 || i === 20) {
      uuid += '-';
    }
    uuid += (i === 12 ? 4 : i === 16 ? (random & 3) | 8 : random).toString(16);
  }
  return uuid;
}

// Creates data to import into database
function formatDataToImportIntoDatabase(inputFileName, outputFilename) {
  fs.readFile(inputFileName, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the input JSON file:', err);
      return;
    }

    try {
      let schoolDirectoryData = JSON.parse(data);
      let formattedData = [];
      let counter = 1;
      schoolDirectoryData = schoolDirectoryData.map(item => {
        // Replace null word with '' value
        for (const key in item) {
          if (item.hasOwnProperty(key)) {
            // Check if the property is empty and replace it with null
            if (item[key] === 'null') {
              item[key] = '';
            }
          }
        }

        const uniqueId = generateUUID();

        const dataObject = {
          directory_organization_id: counter,
          unique_id: uniqueId,
          user_id: 2,
          name: item.name,
          address: item.address,
          city: item.city,
          state: item.state,
          zip_code: item.zip_code,
          country: item.country,
          phone: item.phone,
          website: item.website,
          email_primary: item.email_primary,
          contact_person: item.contact_person,
          contact_person_role: item.contact_person_role,
          latitude: item.latitude,
          longitude: item.longitude,
          map_object_id: item.map_object_id,
          is_imported: 1,
          is_active: 1
        }
        formattedData.push(dataObject);
        counter++;
        return formattedData;
      });

      saveToJsonFile(formattedData, outputFilename);
    } catch {

    }
  });
}

const inputFileName = 'wiser-usa/new/list-combined-database.json';
const outputFilename = 'wiser-usa/new/list-combined-database.json';
formatDataToImportIntoDatabase(inputFileName, outputFilename);

function formatDataToImportIntoArcgis(inputFileName, outputFilename) {
  fs.readFile(inputFileName, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the input JSON file:', err);
      return;
    }

    try {
      let schoolDirectoryData = JSON.parse(data);
      let formattedData = [];
      schoolDirectoryData = schoolDirectoryData.map(item => {
        const dataObject = {
          SCHOOL_NAME: item.name,
          SCHOOL_ADDRESS: item.address,
          city: item.city,
          state: item.state,
          ZIP_CODE: item.zip_code,
          phone: item.phone,
          website: item.website,
          CONTACT_PERSON: item.contact_person,
          role: item.contact_person_role,
          EMAIL_ADDRESS: item.email_primary,
          latitude: item.latitude,
          longitude: item.longitude
        }

        formattedData.push(dataObject);
        return formattedData;
      });

      saveToJsonFile(formattedData, outputFilename);
    } catch {

    }
  });
}

const inputFileName2 = 'wiser-usa/new/list-combined-database.json';
const outputFilename2 = 'wiser-usa/new/list-combined-arcgis.json';
// formatDataToImportIntoArcgis(inputFileName2, outputFilename2);

const outputFileNameDatase = 'wiser-usa/database/islamic-school-directory-wiserusa-formatted_for_database.json';
// replaceEmptyValueNull(inputFileName2, outputFileNameDatase);

function replaceEmptyValueNull(inputFileName, outputFilename) {
  fs.readFile(inputFileName, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the input JSON file:', err);
      return;
    }

    try {
      let schoolDirectoryData = JSON.parse(data);
      let formattedData = [];
      schoolDirectoryData = schoolDirectoryData.map(item => {
        // Iterate through the properties of each object
        for (const key in item) {
          if (item.hasOwnProperty(key)) {
            // Check if the property is empty and replace it with null
            if (!item[key]) {
              item[key] = 'null';
            }
          }
        }
        return item;
      });

      // console.log(schoolDirectoryData);

      saveToJsonFile(schoolDirectoryData, outputFilename);
    } catch {

    }
  });
}
