import fs from 'fs';
import path from 'path';
import extractFile from './pdfExtract.js';
import { fileURLToPath } from 'url';
import { csvCreation } from './dataProcessingAndCsvCreation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//keep your files in this folder giving sequenctional numeric index at the end of file name 
//NOTE:name should follow the convention first 6 characters to be its name and remaning to be file number
//Like output0
const srcFolder = 'inputFiles';

const fullPath = path.join(__dirname, srcFolder);
const files = fs.readdirSync(fullPath);
let filesarr = new Array(files.length);

const extract = async (file) => {
  await extractFile(file, srcFolder);
}

try {
  files.forEach((file) => {
    if (path.parse(file).ext == '.pdf') {
      //just push the files into filesarr without doing this
      //if you dont need output on basis of file indexing
      //then you need not to follow any convention
      filesarr[path.parse(file).name.slice(6)] = path.parse(file).name;
    }
  });
} catch (error) {
  console.log(error);
}

const extractPromises = filesarr.map((ele) => extract(ele));//Extracting all files present in the folder
//Beginning file data extraction and CSV creation process
Promise.all(extractPromises)
  .then(async () => {
    let flag = 0;
    const csvCreationPromises = filesarr.map((ele) => {
      return new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            await csvCreation(`./output/ExtractTextTableWithTableStructure${ele}.zip`, flag);
            resolve();
          } catch (error) {
            reject(error);
          }
          flag++;
        }, 3000);
      });
    });
    await Promise.all(csvCreationPromises);
    console.log('All extraction finished. Your CSV is ready');
    console.log(flag);
  })
  .catch((error) => {
    console.log(error);
  });

//There was another approach to do it and making sure that no error occurs but it took around 20min to execute so I choose this since it was much much faster
//But now we are making multiple extract calls altogether. Since I am not sure of judging parameters I am assuming speed as an important factor more than storage
//If an error occurs Re-run it 

  //We can add few lines of code here to delete the extracted zip files after CSV file is ready.
  //It was not clear in PS whether to keep these extracted files or not so I am saving them currently
