const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Login
router.post('/login', authController.login);
router.post('/register', authController.register); // opsional


module.exports = router;
