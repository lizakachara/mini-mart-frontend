const express = require("express");
const { randomUUID } = require("crypto");
const uploadImage = require("../middleware/imageUpload");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { saveImage, serveImage } = require("../services/imageStorage");

const router = express.Router();
const imageExtensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

router.get("/:filename", serveImage);

router.post("/", protect, adminOnly, (req, res) => {
  uploadImage.single("image")(req, res, async (error) => {
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Choose an image to upload." });
    }

    const filename = `${randomUUID()}${imageExtensions[req.file.mimetype]}`;

    try {
      await saveImage(filename, req.file);
      res.status(201).json({
        image: `${req.protocol}://${req.get("host")}/uploads/${filename}`,
      });
    } catch (uploadError) {
      console.error("Save Uploaded Image Error:", uploadError.message);
      res.status(uploadError.status || 500).json({
        message: "Unable to save the uploaded image.",
      });
    }
  });
});

module.exports = router;