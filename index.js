const fs = require('fs'); // Include the Node.js file system module
const googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyCRIIew-eQp2QjI5mRLFOE-qoUnl-qKC38' // Replace with your actual Google Maps API key
});

// Function to geocode addresses and update the array
function geocodeAddressesAndSaveToJson(data) {
  const promises = data.map(async (school) => {
    const address = `${school["SCHOOL_ADDRESS"]}, ${school["ZIP_CODE"]}`;

    // Geocode the address
    const response = await geocodeAddress(address);

    if (response && response[0]) {
      // Update latitude and longitude in the original data
      school["LATITUDE"] = response[0].geometry.location.lat;
      school["LONGITUDE"] = response[0].geometry.location.lng;
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
fs.readFile('islamic-school-directory-json.json', 'utf8', (err, data) => {
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
