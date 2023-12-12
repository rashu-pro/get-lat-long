const fs = require('fs');

function formatDataToImportIntoDatabase(inputFileName, outputFilename) {
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
            OBJECTID: item.directory_organization_id,
            SCHOOL_NAME: item.name,
            SCHOOL_ADDRESS: item.address,
            city: item.city,
            state: "California",
            ZIP_CODE: 94583,
            phone: "925-380-6432",
            website: "https://srvic.org/islamic-school/",
            CONTACT_PERSON: "Nasira Sharieff",
            role: "",
            EMAIL_ADDRESS: "hasiba@SRVIC.org",
            latitude: 37.77678700000001,
            longitude: -121.969178,
            FID: item.directory_organization_id
          }
  
          formattedData.push(dataObject);
          return formattedData;
        });
  
        saveToJsonFile(formattedData, outputFilename);
      } catch {
  
      }
    });
  }