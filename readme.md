# Folder Extractor

This program allows you to extract data from all pdf files in a folder and generate a CSV file.


## Usage

There are two ways to run this program:

### 1. Run `folderExtract.js` directly

1. Open a terminal or command prompt.
2. Navigate to the project directory.
3. Run the following command:

    ```shell
   node folderExtract.js

### 2. Use npm script

1. Open a terminal or command prompt.
2. Navigate to the project directory.
3. Run the following command:

     ```shell
     npm run extract-csv

## Configuration

Before running the program, you may need to modify the *pdfservices-api-credentials.json* and *private.key* file and update the necessary values according to your requirements.

**Note:**

- Credentials and private keys used by this program may run out or may not be provided. In such cases, you may need to add your own credentials and private key.
- Please ensure that you follow the necessary security practices when handling sensitive information.


## File Placement

To use this program, please ensure that you place your files in the designated "input" folder within the project directory. The program will process the files located in this folder and generate the CSV output accordingly.

## Data Processing and CSV Creation

The data processing and CSV creation logic is implemented in the `dataProcessingAndCsvCreation.js` file. This file handles the extraction of data from the input files, performs any necessary processing, and generates the final CSV output file.

If you need to customize the data processing or CSV generation logic, you can modify the code in the `dataProcessingAndCsvCreation.js` file according to your requirements.

**Note:**
- It's important to keep your files in the "input" folder for the program to locate and process them correctly.
- Make sure the files you want to extract data from follow the specified file naming convention.
- Incase some pdf extraction is failed . Try Re-Running the program, It may happen dur to poor network connection or invalid file path

For any further assistance, Feel free to contact me.
