import xlsx from 'xlsx';
import { writeFileSync } from 'fs';

/**
 * Convert an Excel spreadsheet to a JavaScript file containing an array of objects.
 * @param {string} inputPath - Path to the Excel file.
 * @param {string} outputPath - Path to the output JavaScript file.
 */

const { readFile, utils } = xlsx;

export function convertExcelToJs(inputPath, outputPath) {
  // Read the Excel file
  const workbook = readFile(inputPath);

  // Get the name of the first sheet
  const sheetName = workbook.SheetNames[0];

  // Get the data from the first sheet
  const sheet = workbook.Sheets[sheetName];

  // Convert the sheet to JSON
  const jsonData = utils.sheet_to_json(sheet);

  // Convert the JSON data to JavaScript code
  const jsData = `const data = ${JSON.stringify(jsonData, null, 2)};\n\nexport default data;`;

  // Write the JavaScript file
  writeFileSync(outputPath, jsData, 'utf8');

  console.log(`Data has been converted and saved to ${outputPath}`);
}


