const CompanyProfile = require('../models/CompanyProfile');
const { sendError } = require('../utils/helper');

exports.createCompanyProfile = async (req, res) => {
  try {
    const { name, contact, email, about, address, socialLinks } = req.body;

    // Validate required fields
    if (!name || !contact || !email || !about || !address) {
      return sendError(res, "Missing required fields");
    }

    // Check if a company profile already exists
    const existingProfile = await CompanyProfile.findOne();
    if (existingProfile) {
      return sendError(res, "Company profile already exists. Use update instead.", 400);
    }

    // Validate file type if present
    if (req.file) {
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return sendError(res, 'Invalid file type. Only JPEG, PNG, and GIF are allowed');
      }
    }

    // Create and save the company profile
    const newCompanyProfile = new CompanyProfile({
      logoUrl: req.file ? req.file.path : '',
      name: name.trim(),
      about: about.trim(),
      contact: contact,
      email: email.trim().toLowerCase(),
      address: address.trim(),
      socialLinks: {
        facebook: socialLinks?.facebook ? socialLinks.facebook.trim() : '',
        twitter: socialLinks?.twitter ? socialLinks.twitter.trim() : '',
        instagram: socialLinks?.instagram ? socialLinks.instagram.trim() : '',
        linkedin: socialLinks?.linkedin ? socialLinks.linkedin.trim() : '',
      },
    });

    await newCompanyProfile.save();

    // Remove file path from response if you want to be more secure
    const companyProfileResponse = newCompanyProfile.toObject();
    if (companyProfileResponse.logoUrl) {
      companyProfileResponse.logoUrl = companyProfileResponse.logoUrl.replace('public/', '');
    }

    return res.status(201).json({
      message: "Company Profile created successfully",
      companyProfile: companyProfileResponse
    });

  } catch (error) {
    console.error('Error creating company Profile:', error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: 'Validation error', errors: messages });
    }

    // Handle duplicate key errors (email uniqueness)
    if (error.code === 11000) {
      return sendError(res, 'Email address is already in use');
    }

    return res.status(500).json({ 
      message: 'Server error occurred while creating company profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Fetch all events
exports.fetchCompanyProfile = async (req, res) => {
    try {
      const profile = await CompanyProfile.find();
      res.status(200).json(profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };


exports.updateCompanyProfile = async (req, res) => {
  try {
    const updates = req.body;
    
    // 1. Handle file upload if present
    if (req.file) {
      // If there was a previous image, delete it
      if (updates.logoUrl) {
        const oldImagePath = path.join(__dirname, '..', updates.logoUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      // Update with new image path
      updates.logoUrl = req.file.path;
    }

    // 2. Find and update the company profile
    const updatedProfile = await CompanyProfile.findOneAndUpdate(
      {},
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      return sendError(res, "Company profile not found", 404);
    }

    return res.json({
      success: true,
      message: "Company profile updated successfully",
      companyProfile: updatedProfile
    });

  } catch (error) {
    console.error('Error updating company profile:', error);

    // Handle Multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FIELD_VALUE') {
        return sendError(res, 'Field value too large. Please reduce the size of text fields or use file upload for images.', 413);
      }
      return sendError(res, 'File upload error: ' + error.message, 400);
    }

    // Handle other errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return sendError(res, 'Validation error: ' + messages.join(', '), 400);
    }

    if (error.code === 11000) {
      return sendError(res, 'Duplicate key error. Email address may already be in use.', 400);
    }

    return sendError(res, 'Server error occurred while updating company profile', 500);
  }
};



