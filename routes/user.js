const express = require('express');
const { addUser, deleteUser, updateUser, getUserByID, getUserRole, getAllApplicationUser } = require('../controller/user');

const router = express.Router()

// Login endpoint
router.post('/create', addUser);
   
  // delete users
router.delete('/:userId', deleteUser);

// update user
router.post('/update-user',updateUser);

// get a user by username
router.post('/get-user-byId',getUserByID);

// get a user role
router.post('/check-user-role',getUserRole);

// get all users
router.get('/application-user',getAllApplicationUser)


module.exports = router