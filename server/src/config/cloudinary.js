const cloudinary = require('cloudinary').v2;

// cloudinary reads CLOUDINARY_URL from the environment automatically.
cloudinary.config({ secure: true });

module.exports = cloudinary;
