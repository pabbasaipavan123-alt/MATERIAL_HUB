const express = require("express");
const cloudinary = require("cloudinary").v2;
const Note = require("../models/Note");

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// GET /api/notes → list all notes
router.get("/notes", async (req, res) => {
  try {
    const notes = await Note.find().sort({ uploadedAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// GET /api/notes/:id → single note
router.get("/notes/:id", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found" });
    res.json(note);
  } catch (err) {
    res.status(400).json({ error: "Invalid note ID" });
  }
});

// GET /api/search?q= → search notes by title
router.get("/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  try {
    if (!q) {
      const notes = await Note.find().sort({ uploadedAt: -1 });
      return res.json(notes);
    }
    const notes = await Note.find({
      title: { $regex: q, $options: "i" }
    }).sort({ uploadedAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
});

// DELETE /api/notes/:id → delete note + PDF from Cloudinary
router.delete("/notes/:id", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found" });

    if (note.pdfPublicId) {
      await cloudinary.uploader.destroy(note.pdfPublicId, {
        resource_type: note.pdfResourceType || "image"
      });
    }

    await note.deleteOne();
    res.json({ ok: true, message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});


module.exports = router;
