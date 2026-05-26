const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary'); 


const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'foodwave_menu', 
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit (10 * 1024 * 1024 bytes)
  }
});

module.exports = upload;