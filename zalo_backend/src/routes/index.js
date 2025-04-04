const express = require('express');
const { register, login } = require('../controllers/access.controller');
const getAllUsers = require('../controllers/user.controller');
const { getMessage } = require('../controllers/message.controller');

const router = express.Router();

router.post('/auth/register', register)
router.post('/auth/login', login)
router.get('/user/getAll', getAllUsers)

router.get('/message/:senderId/:receiveId', getMessage)

module.exports = router