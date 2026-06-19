const express = require('express');
const router = express.Router();
const { register, login, verify } = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/verify', authMiddleware, verify);

module.exports = router;
