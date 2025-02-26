const axios = require("axios");

module.exports = {
  uploadImage: async (imagePath) => {
  const data = new FormData();
  const filename = imageUri.split("/").pop();
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : `image`;

  data.append("file", { uri: imageUri, name: filename, type });
  data.append("upload_preset", "your_upload_preset"); // Replace with your Cloudinary upload preset

  const res = await axios.post("https://api.cloudinary.com/v1_1/your_cloud_name/image/upload", data);
  return res.data.secure_url; // Return the image URL
};
