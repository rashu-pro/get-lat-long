const fs = require('fs'); // Include the Node.js file system module

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

  console.log('address: ', address);
  console.log('formatted address: ', formattedAddress[0].formatted_address);
  console.log('----------------');
  // console.log('formatted address: ', formattedAddress);
  return formattedAddress;
}

// let supportingAddressParameter = [1949, 'Plano', 'Texas'];
// getAddress('4700 14th Street', supportingAddressParameter, 0);
// return;

// Function to geocode addresses and update the array
function geocodeAddressesAndSaveToJson(data) {
  const promises = data.map(async (school) => {
    const address = `${school["SCHOOL_ADDRESS"]}, ${school["ZIP_CODE"]}`;

    // Geocode the address
    // const response = await geocodeAddress(address);
    let zipCode = String(school['ZIP_CODE']);
    if(zipCode.length<5){
      zipCode = '0'+zipCode;
      // zipCode = parseInt(zipCode);
      console.log(zipCode);
      console.log('============');
    }
    const addressParameter = [zipCode, school['CITY'], school['STATE']];
    const response = await getAddress(school['SCHOOL_ADDRESS'], addressParameter, 0);

    // console.log('address: ', response[0].address_components);
    // console.log(response[0].formatted_address);

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
      saveToJsonFile(updatedData, 'islamic-school-directory-data-updated.json');
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
fs.readFile('isla-school-directory.json', 'utf8', (err, data) => {
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
