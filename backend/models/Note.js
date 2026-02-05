const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  semester: { type: Number, required: true },
  pdfUrl: { type: String, required: true },
  pdfPublicId: { type: String, required: true },
  pdfResourceType: { type: String, default: "image" },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Note", noteSchema);
