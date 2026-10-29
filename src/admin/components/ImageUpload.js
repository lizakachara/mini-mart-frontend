import React, { useId, useState } from "react";
import { FaTimes, FaUpload } from "react-icons/fa";
import "../css/ImageUpload.css";

const UPLOAD_URL = "https://mini-mart-cdkr.onrender.com/api/uploads";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function ImageUpload({ image, onImageChange, onUploadStateChange, disabled }) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Choose a JPG, PNG, WEBP, or GIF image.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be 5 MB or smaller.");
      return;
    }

    const token = localStorage.getItem("adminToken");

    if (!token) {
      setError("Your admin session has expired. Please log in again.");
      return;
    }

    setError("");
    setUploading(true);
    onUploadStateChange(true);

    try {
      const body = new FormData();
      body.append("image", file);

      const response = await fetch(UPLOAD_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            "Image uploads are not enabled on the server yet. Deploy the latest backend, then try again."
          );
        }

        throw new Error(data?.message || "Image upload failed.");
      }

      if (!data?.image) {
        throw new Error("The server returned an invalid image upload response.");
      }

      onImageChange(data.image);
    } catch (uploadError) {
      setError(uploadError.message || "Image upload failed.");
    } finally {
      setUploading(false);
      onUploadStateChange(false);
    }
  };

  const handleRemove = () => {
    setError("");
    onImageChange("");
  };

  return (
    <div className="admin-image-upload">
      <label className="admin-image-upload-label" htmlFor={inputId}>
        Image
      </label>
      <div className="admin-image-upload-actions">
        <label
          className={`admin-image-upload-button${disabled || uploading ? " disabled" : ""}`}
          htmlFor={inputId}
          aria-disabled={disabled || uploading}
        >
          <FaUpload />
          {uploading ? "Uploading..." : image ? "Replace image" : "Upload image"}
        </label>
        <input
          id={inputId}
          className="admin-image-upload-input"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleUpload}
          disabled={disabled || uploading}
        />
        {image && (
          <button
            className="admin-image-remove-button"
            type="button"
            onClick={handleRemove}
            disabled={disabled || uploading}
          >
            <FaTimes />
            Remove image
          </button>
        )}
      </div>
      {image && (
        <img className="admin-image-upload-preview" src={image} alt="Selected" />
      )}
      <p className="admin-image-upload-hint">JPG, PNG, WEBP, or GIF, up to 10 MB</p>
      {error && <p className="admin-image-upload-error" role="alert">{error}</p>}
    </div>
  );
}

export default ImageUpload;