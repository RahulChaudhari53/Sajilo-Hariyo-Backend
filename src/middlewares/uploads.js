const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Configure Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "public/uploads/misc"; // Default fallback

    // Logic: Decide folder based on field name or file type
    if (file.fieldname === "image" || file.fieldname === "gallery") {
      uploadPath = "public/uploads/products";
    } else if (file.fieldname === "arModel") {
      uploadPath = "public/uploads/ar";
    } else if (file.fieldname === "profileImage") {
      uploadPath = "public/uploads/profiles";
    }

    ensureDir(uploadPath); // Create folder if missing
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique name: fieldname-timestamp.ext
    // Example: image-123456789.png
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// File Filter (Security)
const fileFilter = (req, file, cb) => {
  //   if (file.fieldname === "image" || file.fieldname === "profileImage") {
  //     // Accept Images
  //     if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
  //       return cb(new Error("Only image files are allowed!"), false);
  //     }
  if (
    file.fieldname === "image" ||
    file.fieldname === "gallery" ||
    file.fieldname === "profileImage"
  ) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
  } else if (file.fieldname === "arModel") {
    // Accept 3D Models
    if (!file.originalname.match(/\.(glb|gltf)$/)) {
      return cb(
        new Error("Only .glb or .gltf files are allowed for AR!"),
        false
      );
    }
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // Limit: 100MB
  fileFilter: fileFilter,
});

module.exports = upload;
