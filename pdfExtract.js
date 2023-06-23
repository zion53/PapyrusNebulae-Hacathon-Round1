
import PDFServicesSdk from '@adobe/pdfservices-node-sdk';
import fs from 'fs';

const extractFile = async (filename, src_path) => {
  const MAX_RETRIES = 3; // Maximum number of retries
  const RETRY_DELAY_MS = 2000; // Delay between retries in milliseconds

  try {
    const credentials = PDFServicesSdk.Credentials.serviceAccountCredentialsBuilder()
      .fromFile("pdfservices-api-credentials.json")
      .build();

    const executionContext = PDFServicesSdk.ExecutionContext.create(credentials);

    const options = new PDFServicesSdk.ExtractPDF.options.ExtractPdfOptions.Builder()
      .addElementsToExtract(PDFServicesSdk.ExtractPDF.options.ExtractElementType.TEXT, PDFServicesSdk.ExtractPDF.options.ExtractElementType.TABLES)//Extracting Json Data
      .addTableStructureFormat(PDFServicesSdk.ExtractPDF.options.TableStructureType.CSV)// Extracting tables as CSV
      .build();

    const extractPDFOperation = PDFServicesSdk.ExtractPDF.Operation.createNew();
    const input = PDFServicesSdk.FileRef.createFromLocalFile(
      `./${src_path}/${filename}.pdf`,
      PDFServicesSdk.ExtractPDF.SupportedSourceFormat.pdf
    );

    extractPDFOperation.setInput(input);
    extractPDFOperation.setOptions(options);

    let retries = 0;

    while (retries < MAX_RETRIES) {
      try {
        const result = await extractPDFOperation.execute(executionContext);
        const outputPath = `output/ExtractTextTableWithTableStructure${filename}.zip`;

        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath); // Delete the file if it already exists
        }

        result.saveAsFile(outputPath);
        break; // Break out of the loop if the operation succeeds
      } catch (err) {
        retries++;
        console.log(`Retry attempt ${retries} failed. Retrying in ${RETRY_DELAY_MS}ms...`);

        if (retries >= MAX_RETRIES) {
          console.log('Maximum number of retries reached. Operation failed.');
          throw err;
        }

        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  } catch (err) {
    console.log('Exception encountered while executing operation', err);
  }
};

export default extractFile;

