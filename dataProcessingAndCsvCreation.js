import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import { createObjectCsvWriter } from 'csv-writer';


export const csvCreation = async (zipFolderPath, headerFlg) => {
  const outputZip = zipFolderPath;
  const zip = new AdmZip(outputZip);
  
  //assigning CSV headers
  const csvHeader = [
    { id: "businessCity", title: "Bussiness__City" },
    { id: "businessCountry", title: "Business__Country" },
    { id: "bussinessDescription", title: "Business__Description" },
    { id: "bussinessName", title: "Business__Name" },
    { id: "businessStreetAddress", title: "Business__StreetAddress" },
    { id: "businessZipCode", title: "Business__ZipCode" },
    { id: "customerAddressLine1", title: "Customer__Address__line1" },
    { id: "customerAddressLine2", title: "Customer__Address__line2" },
    { id: "customerEmail", title: "Customer__Email" },
    { id: "customerName", title: "Customer__Name" },
    { id: "customerPhoneNumber", title: "Customer__PhoneNumber" },
    { id: "item", title: "Invoice__BillDetails__Name" },
    { id: "quantity", title: "Invoice__BillDetails__Quantity" },
    { id: "rate", title: "Invoice__BillDetails__Rate" },
    { id: "invoiceDescription", title: "Invoice__Description" },
    { id: "issueDueDate", title: "Invoice__DueDate" },
    { id: "issueDate", title: "Invoice__IssueDate" },
    { id: "invoiceNumber", title: "Invoice__Number" },
    { id: "invoiceTax", title: "Invoice__Tax" },
  ];

  const csvWriter = createObjectCsvWriter({
    path: './ExtractedCsvData.csv',
    header: csvHeader,
    append: true,
  });

  //Function which adds data row into CSV file 
  const addRow = async (Row) => {
    csvWriter
      .writeRecords([Row])
      .then(() => {
        // console.log("Data row added to CSV file successfully.");
      })
      .catch((error) => {
        console.error("Error adding data row to CSV file:", error);
      });
  }
  
  const headerText = {
    "businessCity": "Bussiness__City",
    "businessCountry": "Business__Country",
    "bussinessDescription": "Business__Description",
    "bussinessName": "Business__Name",
    "businessStreetAddress": "Business__StreetAddress",
    "businessZipCode": "Business__ZipCode",
    "customerAddressLine1": "Customer__Address__line1",
    "customerAddressLine2": "Customer__Address__line2",
    "customerEmail": "Customer__Email",
    "customerName": "Customer__Name",
    "customerPhoneNumber": "Customer__PhoneNumber",
    "invoiceDescription": "Invoice__Description",
    "item": "Invoice__BillDetails__Name",
    "quantity": "Invoice__BillDetails__Quantity",
    "rate": "Invoice__BillDetails__Rate",
    "invoiceNumber": "Invoice__Number",
    "issueDueDate": "Invoice__DueDate",
    "issueDate": "Invoice__IssueDate",
    "invoiceTax": "Invoice__Tax",
  };

  if (headerFlg == 0) {
    if (fs.existsSync('./ExtractedCsvData.csv')) {  // Creating csv with only headers for first run 
      fs.unlinkSync('./ExtractedCsvData.csv');
    } 
    await addRow(headerText);
  }

  let jsonData = zip.readAsText("structuredData.json");
  let data = JSON.parse(jsonData);
  let reqData = [];
  let length = 0;
  for (let i = 0; i < data.elements.length; i++) {
    const element = data.elements[i];
    if (element.Text) {
      reqData.push(element.Text);
      length++;
    }
  }
  //Business name always at start in JSON data
  const businessName = reqData[0];

  //A function which takes JSON data and gets respective sections of pdf on basis of bounds
  function groupElements(jsonData) {
    const groupedData = [];

    // Find the minimum X and Y coordinates to use as reference
    let minX = Infinity;
    let minY = Infinity;
    for (const element of jsonData.elements) {
      if (element.Bounds == undefined) continue;
      const [left, top] = element.Bounds;
      if (left < minX) {
        minX = left;
      }
      if (top < minY) {
        minY = top;
      }
    }

    // Create a Map to store elements grouped by X coordinate
    const groups = new Map();

    // Iterate over the elements in the JSON data
    for (const element of jsonData.elements) {
      const { Text, Bounds } = element;
      if (Text === undefined || Bounds == undefined) {
        continue; // Skip elements with undefined text
      }
      const [left, top] = Bounds; // Extract X and Y coordinates from Bounds
      // Calculate the relative position based on the minimum coordinates
      const relativeX = left - minX;
      const relativeY = top - minY;

      // Create a key based on X coordinate
      const key = `${relativeX}`;

      // Check if the group exists in the Map
      if (groups.has(key)) {
        // If the group exists, append the element's text to it
        const group = groups.get(key);
        group.text += ' ' + Text;
      } else {
        // If the group doesn't exist, create a new group with the element's text
        groups.set(key, { text: Text, x: relativeX, y: relativeY });
      }
    }
    // Convert the groups Map into an array
    for (const [key, group] of groups) {
      groupedData.push({
        Key: key,
        Text: group.text, //can't use without unique key
      });
    }
    return groupedData;
  }
  //storing sections with similar bounds together in groupedData
  const groupedData = groupElements(data);

  let details = '';
  let billTo = '';

  //Obtaining data given under BILL TO and Details sections 
  for (let i = 0; i < groupedData.length; i++) {
    if (groupedData[i].Text.includes('DETAILS')) {
      details = groupedData[i].Text.replace('DETAILS', '').trim();
    } else if (groupedData[i].Text.includes('BILL TO')) {
      billTo = groupedData[i].Text.replace('BILL TO', '').trim();
    }
  }

  //Finding required data given under BILL TO section
  const nameRegex = /([a-zA-Z]+\s[a-zA-Z]+)/;
  const emailRegex = /(\S+@\S+)/;
  const phoneRegex = /(\d{3}-\d{3}-\d{4})/;

  const customerName = billTo.match(nameRegex)[0].trim();
  let email = billTo.match(emailRegex)[0].trim();
  const phoneNumber = billTo.match(phoneRegex)[0].trim();
  const billToParts = billTo.split(' ').filter(part => part !== '');

  const emailIndex = billToParts.findIndex(part => emailRegex.test(part));
  if (billToParts[emailIndex + 1].endsWith('m')) {
    email += billToParts[emailIndex + 1]
  }
  const phoneIndex = billToParts.findIndex(part => phoneRegex.test(part));
  const addressLine1 = billToParts.slice(phoneIndex + 1, phoneIndex + 4).join(' ');
  const addressLine2 = billToParts.slice(phoneIndex + 4).join(' ');
  let dueDate = '';

//finding Due date in from data obtained using bounds
  for (const item of groupedData) {
    if (item.Text.includes('Due date:')) {
      dueDate = item.Text.split('Due date:')[1].trim();
      break;
    }
  }
  //Finding address from Json data since grouped data has some discrepancies and this was simpler and uniform in all 
  let address = "";
  let invoiceTextJsonIndex = 2;
  for (let i = 1; i < 5; i++) {
    if (reqData[i].slice(0, 7) === "Invoice") {
      invoiceTextJsonIndex = i;
      break;
    }
    address += reqData[i];
  }

  //Obtaining invoice number from grouped data and making sure that it doesn't contains issue date
  const invoiceObject = groupedData.find(item => item.Text.includes('Invoice#'));
  const invoiceText = invoiceObject.Text;
  const invoiceNumber = invoiceText.split('Invoice# ')[1].trim();
  let invoiceNum = "";
  if (!invoiceNumber) {
    const invoiceIndex = groupedData.findIndex(item => item.Text.includes('Invoice#'));
    invoiceNum = groupedData[invoiceIndex + 1].Text.trim().split(" ")[0];
  }
  else {
    invoiceNum = invoiceNumber;
  }
  if (invoiceNum.trim().includes(" ")) {
    invoiceNum = invoiceNum.trim();
    let invSplit = invoiceNum.split(" ");
    invoiceNum = invSplit[0];
  }

  //just splitting complete address into required parameters
  let parts = address.split(",");
  let businessAddress = parts[0].trim();
  let businessCity = parts[1].trim();
  let countryAndState = parts.slice(2).join(",").trim();
  let zipCode = parts[3].trim().split(" ")[1];
  let businessCountry = countryAndState.substring(
    0,
    countryAndState.lastIndexOf(" ")
  );

  //Getting issue data from JSON data
  let issueDate;
  let issueIndex;
  for (let i = invoiceTextJsonIndex; i < 10; i++) {
    const ele = reqData[i].trim();
    if (ele.slice(-5)[0] === "-") {
      issueDate = ele.slice(-10);
      issueIndex = i;
      break;
    }
  }

  let businessDescription = "";
  let businessDescriptionIndex = issueIndex + 2;
  for (
    let i = businessDescriptionIndex;
    reqData[i].trim() !== "BILL TO";
    i++, businessDescriptionIndex++
  ) {
    businessDescription += reqData[i];
  }

  //First checking for tax in grouped data if it is not present in it than searching in JSON for similar element
  const lastText = groupedData[groupedData.length - 1].Text;
  const taxArray = lastText.split(" ").filter(part => part !== "" && !part.includes("$"));

  const tax = taxArray[0];
  let taxFinal;
  if (!tax) {
    for (let i = reqData.length - 7; i < reqData.length; i++) {
      const regex = /^[^$]+\d+(\.\d+)?$/;
      const matches = reqData[i].trim().match(regex);

      if (matches) {
        taxFinal = matches[0]
      }
    }
  }
  else {
    taxFinal = tax;
  }

  //Finding correct CSV file containing items files obtained from sdk are non-uniform 
  let csvFileEntry;
  for (const zipEntry of zip.getEntries()) {
    const zipEntryJson = await JSON.parse(zipEntry)
    if (path.parse(zipEntryJson.name).ext == ".csv") {
      const csvContent = zip.readAsText(zipEntry)
      const firstrow = csvContent.split("\n")[0];
      const headerLength = firstrow.split(",").length;
      if ((headerLength) === 4 && firstrow.split(",")[0].trim() != "ITEM") {
          csvFileEntry = zipEntry;
      }
    }
  }
  if (csvFileEntry) {
    const csvContent = zip.readAsText(csvFileEntry);
    const rows = csvContent.split("\n");
    //Processing each row/item
    for (let i = 0; i < rows.length - 1; i++) {
      const rowData = rows[i].split(",");

      const item = rowData[0];
      const quantity = rowData[1];
      const rate = rowData[2];
      const amount = rowData[3];

      // Add the data row to the CSV file
      const headerRow = {
        "bussinessName": businessName,
        "businessStreetAddress": businessAddress,
        "businessCity": businessCity,
        "businessCountry": businessCountry,
        "bussinessDescription": businessDescription,
        "businessZipCode": zipCode,
        "customerName": customerName,
        "customerEmail": email,
        "customerPhoneNumber": phoneNumber,
        "customerAddressLine1": addressLine1,
        "customerAddressLine2": addressLine2,
        "invoiceNumber": invoiceNum,
        "invoiceDescription": details,
        "item": item,
        "quantity": quantity,
        "rate": rate,
        "issueDate": issueDate,
        "issueDueDate": dueDate,
        "invoiceTax": taxFinal
      };
      try {
        await addRow(headerRow);
        // console.log('Row added successfully.');
      } catch (error) {
        console.error('Error while adding row:', error);
      }
      

    }
  }
  else {
    console.log("No CSV file containing items found in extracted files")
  }
}



