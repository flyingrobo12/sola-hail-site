const fs = require('fs');
const path = require('path');
const csv = require('csvtojson');

const inputPath = path.join(__dirname, '..', 'output', 'payout_results.csv');
const outputPath = path.join(__dirname, 'data', 'annual_payouts.json');

csv()
  .fromFile(inputPath)
  .then((jsonObj) => {
    fs.writeFileSync(outputPath, JSON.stringify(jsonObj, null, 2), 'utf-8');
    console.log('✅ CSV converted to annual_payouts.json');
  });
