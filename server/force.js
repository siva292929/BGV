const mongoose = require('mongoose');
// Use the same URI you used earlier
const MONGO_URI = "mongodb://localhost:27017/BGV"; 

const MasterRecord = require('./models/MasterRecord');

async function updateData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected for Update...");

    const result = await MasterRecord.updateOne(
      { phoneNumber: "9876543210" },
      { 
        $set: { 
          tenthPercentage: "92%",
          twelfthPercentage: "88%",
          degreeGPA: "7.5",
          "documents.tenthMarksheetUrl": "https://example.com/10th.pdf",
          "documents.twelfthMarksheetUrl": "https://example.com/12th.pdf",
          "documents.degreeUrl": "https://example.com/degree.pdf"
        } 
      }
    );

    console.log("✅ Update Successful:", result);
    process.exit();
  } catch (err) {
    console.error("❌ Update Failed:", err);
    process.exit(1);
  }
}

updateData();