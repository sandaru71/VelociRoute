const CLOUDINARY_CLOUD_NAME = 'velociroute';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default';

export const uploadToCloudinary = async (imageUri) => {
  try {
    console.log('Starting Cloudinary upload with:', {
      cloudName: CLOUDINARY_CLOUD_NAME,
      uploadPreset: CLOUDINARY_UPLOAD_PRESET,
      imageUri: imageUri
    });

    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'upload.jpg',
    });
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    console.log('Uploading to URL:', url);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        console.error('Cloudinary error response:', data);
        throw new Error(data.error?.message || 'Failed to upload image');
      }

      console.log('Upload successful:', data.secure_url);
      return data.secure_url;
    } catch (networkError) {
      console.error('Network error details:', {
        message: networkError.message,
        stack: networkError.stack,
        cause: networkError.cause
      });
      throw networkError;
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};
