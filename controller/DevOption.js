const DevOptions = require("../models/DevOption");
const { sendError } = require("../utils/helper");

// Get or create dev options for a user
const getDevOptions = async (req,res) => {

    try {
        const {userId} = req.params;

        console.log(userId)
        if(!userId) return sendError(res, "UserId is null!");

        let options = await DevOptions.findOne({ user: userId });
        
        if (!options) {
          options = await DevOptions.create({ user: userId });
          console.log(options);
        }
        
        res.status(200).json({success: true, options})
      } catch (error) {
        throw new Error(`Failed to get dev options: ${error.message}`);
      }
  
};

// Update dev options (creates if doesn't exist)
const updateDevOptions = async (req,res) => {
  try {
    const {userId} = req.params;

    if(!userId) return sendError(res, "userId is empty!");

    const {updateData} = req.body;
    const options = await DevOptions.findOneAndUpdate(
      { user: userId },
      { $set: updateData },
      { 
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true 
      }
    ).populate('user', 'username email');
    
    res.status(200).json({success: true, options})
  } catch (error) {
    throw new Error(`Failed to update dev options: ${error.message}`);
  }
};

// Reset to defaults
const resetDevOptions = async (userId) => {
  try {
    await DevOptions.deleteOne({ user: userId });
    return await getDevOptions(userId); // Returns fresh default options
  } catch (error) {
    throw new Error(`Failed to reset dev options: ${error.message}`);
  }
};

module.exports = {
  getDevOptions,
  updateDevOptions,
  resetDevOptions
};