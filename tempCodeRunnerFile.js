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