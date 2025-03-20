const UserProfile = require('../Infrastructure/Models/UserProfile');
const path = require('path');
const fs = require('fs').promises;
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with better error handling
try {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dq1hjlghb',
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    console.log('Cloudinary configured with cloud name:', process.env.CLOUDINARY_CLOUD_NAME || 'dq1hjlghb');
} catch (error) {
    console.error('Error configuring Cloudinary:', error);
}

const userProfileController = {
    // Upload image to Cloudinary
    uploadImage: async (req, res) => {
        try {
            console.log('Received image upload request');
            
            // Verify request data
            if (!req.body || !req.body.image) {
                console.error('No image data in request');
                return res.status(400).json({ message: 'No image data provided' });
            }

            // Get image data and type
            const base64Data = req.body.image;
            const imageType = req.body.imageType || 'image/jpeg';
            
            // Create data URL
            const dataUrl = `data:${imageType};base64,${base64Data}`;
            
            console.log('Uploading image to Cloudinary...', {
                imageType,
                dataUrlLength: dataUrl.length,
                cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'dq1hjlghb'
            });

            // Upload to Cloudinary with explicit options
            const uploadResponse = await cloudinary.uploader.upload(dataUrl, {
                upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || 'ml_default',
                resource_type: 'auto',
                folder: 'velociroute',
                overwrite: true,
                invalidate: true,
                transformation: [
                    { quality: 'auto:good' },
                    { fetch_format: 'auto' }
                ]
            });

            console.log('Image uploaded successfully:', {
                publicId: uploadResponse.public_id,
                url: uploadResponse.secure_url,
                format: uploadResponse.format,
                size: uploadResponse.bytes
            });

            res.json({ 
                url: uploadResponse.secure_url,
                publicId: uploadResponse.public_id
            });
        } catch (error) {
            console.error('Error uploading image:', {
                message: error.message,
                stack: error.stack,
                details: error.details || 'No additional details'
            });
            res.status(500).json({ 
                message: 'Failed to upload image',
                error: error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    },

    // Get user profile or create empty one if not exists
    getUserProfile: async (req, res) => {
        try {
            const userEmail = req.user.email;
            console.log('Controller: Getting profile for email:', userEmail);
            console.log('Request user object:', req.user);
            
            let profile = await UserProfile.findOne({ email: userEmail });
            console.log('Found profile for email:', userEmail, profile ? 'exists' : 'not found');
            
            if (!profile) {
                console.log('Creating new profile for email:', userEmail);
                try {
                    // Create a new empty profile
                    profile = new UserProfile({
                        email: userEmail
                        // All other fields will use schema defaults
                    });
                    await profile.save();
                    console.log('Created new profile:', profile);
                } catch (createError) {
                    console.error('Error creating profile:', createError);
                    throw createError;
                }
            }
            
            res.json({
                firstName: profile.firstName,
                lastName: profile.lastName,
                preferredActivity: profile.preferredActivity,
                location: profile.location,
                profilePhoto: profile.profilePhoto,
                coverPhoto: profile.coverPhoto
            });
        } catch (error) {
            console.error('Error in getUserProfile:', error);
            res.status(500).json({ 
                message: 'Internal server error', 
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    },

    // Create or update user profile
    updateUserProfile: async (req, res) => {
        try {
            console.log('Received update profile request');
            const userEmail = req.user.email;
            console.log('Updating profile for email:', userEmail);
            
            // Get data from request body
            const {
                firstName = '',
                lastName = '',
                preferredActivity = '',
                location = '',
                profilePhoto = null,
                coverPhoto = null
            } = req.body;

            console.log('Received profile data:', {
                firstName,
                lastName,
                preferredActivity,
                location,
                profilePhoto,
                coverPhoto
            });

            // Find existing profile
            const existingProfile = await UserProfile.findOne({ email: userEmail });
            
            // If profile exists, update it; otherwise create new one
            const profileData = {
                email: userEmail,
                firstName,
                lastName,
                preferredActivity,
                location,
                profilePhoto: profilePhoto || (existingProfile ? existingProfile.profilePhoto : null),
                coverPhoto: coverPhoto || (existingProfile ? existingProfile.coverPhoto : null)
            };

            let updatedProfile;
            if (existingProfile) {
                updatedProfile = await UserProfile.findOneAndUpdate(
                    { email: userEmail },
                    profileData,
                    { new: true }
                );
            } else {
                updatedProfile = await UserProfile.create(profileData);
            }

            console.log('Profile updated successfully:', updatedProfile);
            
            res.json({
                message: 'Profile updated successfully',
                profile: {
                    firstName: updatedProfile.firstName,
                    lastName: updatedProfile.lastName,
                    preferredActivity: updatedProfile.preferredActivity,
                    location: updatedProfile.location,
                    profilePhoto: updatedProfile.profilePhoto,
                    coverPhoto: updatedProfile.coverPhoto
                }
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            res.status(500).json({ 
                message: 'Internal server error', 
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                body: req.body
            });
        }
    },

    // Get multiple user profiles by email
    getBatchProfiles: async (req, res) => {
        try {
            // Get emails from query params
            const emailsParam = req.query.emails;
            if (!emailsParam) {
                return res.status(400).json({ message: 'No emails provided' });
            }

            const emails = emailsParam.split(',');
            console.log('Fetching profiles for emails:', emails);

            // Find all profiles that match the provided emails
            const profiles = await UserProfile.find({ email: { $in: emails } });
            console.log(`Found ${profiles.length} profiles`);

            // Create a map for quick lookup
            const profileMap = {};
            profiles.forEach(profile => {
                profileMap[profile.email] = {
                    email: profile.email,
                    firstName: profile.firstName || '',
                    lastName: profile.lastName || '',
                    profilePhoto: profile.profilePhoto || null
                };
            });

            // Ensure we return a result for every requested email
            const results = emails.map(email => {
                return profileMap[email] || {
                    email: email,
                    firstName: '',
                    lastName: '',
                    profilePhoto: null
                };
            });

            res.json(results);
        } catch (error) {
            console.error('Error in getBatchProfiles:', error);
            res.status(500).json({ message: 'Error fetching profiles', error: error.message });
        }
    },
};

module.exports = userProfileController;
