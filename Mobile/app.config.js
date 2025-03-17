require('dotenv').config();

module.exports = {
  expo: {
    name: "VelociRoute",
    slug: "velociroute",
    version: "1.0.0",
    extra: {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'dq1hjlghb',
      CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET || 'ml_default',
      API_URL: process.env.API_URL || 'http://192.168.18.4:3000',
    },
  },
};
