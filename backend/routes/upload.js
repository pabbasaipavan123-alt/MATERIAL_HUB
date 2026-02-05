const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const Note = require("../models/Note");

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }
});

router.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    const { title, subject, semester } = req.body;
    const file = req.file;

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({ error: "Cloudinary is not configured" });
    }

    if (!title || !subject || !semester || !file) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
            folder: "notes",
            use_filename: true,
            unique_filename: true
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(file.buffer);
    });

    const newNote = await Note.create({
      title,
      subject,
      semester: Number(semester),
      pdfUrl: uploadResult.secure_url,
      pdfPublicId: uploadResult.public_id,
      pdfResourceType: uploadResult.resource_type || "image"
    });

    res.status(201).json(newNote);
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ error: err.message || "Upload failed" });
  }
});

module.exports = router;
