const express = require("express");
const uploadImage = require("../middleware/imageUpload");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, adminOnly, (req, res, next) => {
  uploadImage.single("image")(req, res, (error) => {
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    next();
  });
}, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Choose an image to upload." });
  }

  res.status(201).json({
    image: `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`,
  });
});

module.exports = router;