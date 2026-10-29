const mongoose = require("mongoose");

const BUCKET_NAME = "productImages";

function getBucket() {
  const database = mongoose.connection.db;

  if (!database) {
    const error = new Error("Image storage is unavailable until the database connects.");
    error.status = 503;
    throw error;
  }

  return new mongoose.mongo.GridFSBucket(database, { bucketName: BUCKET_NAME });
}

function saveImage(filename, file) {
  return new Promise((resolve, reject) => {
    const uploadStream = getBucket().openUploadStream(filename, {
      contentType: file.mimetype,
    });

    uploadStream.once("error", reject);
    uploadStream.once("finish", () => resolve(filename));
    uploadStream.end(file.buffer);
  });
}

async function serveImage(req, res, next) {
  try {
    const bucket = getBucket();
    const [file] = await bucket
      .find({ filename: req.params.filename })
      .sort({ uploadDate: -1 })
      .limit(1)
      .toArray();

    if (!file) {
      return res.status(404).send("Image not found.");
    }

    res.set({
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": file.contentType || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });

    const downloadStream = bucket.openDownloadStream(file._id);
    downloadStream.once("error", (error) => {
      if (res.headersSent) {
        res.destroy(error);
      } else {
        next(error);
      }
    });
    downloadStream.pipe(res);
  } catch (error) {
    next(error);
  }
}

module.exports = { saveImage, serveImage };
