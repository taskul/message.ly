const express = require('express');
const router = express.Router();
const User = require('../models/user');
const {ensureCorrectUser, authenticateJWT} = require('../middleware/auth');
const jwt = require('jsonwebtoken');

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/
router.get('/', async (req, res, next) => {
    try{
        let users = await User.all();
        return res.json({users})
    } catch (e) {
        return next(e)
    }
})


/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/
router.get('/:username', ensureCorrectUser, async (req, res, next) => {
    try {
        let user = await User.get(req.params.username);
        return res.render('user/profile.html', {user})
    } catch (e) {
        return next(e)
    }
})


/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get('/:username/to', ensureCorrectUser, async (req, res, next) => {
    try {
        const messagesTo = await User.messagesTo(req.params.username);
        return res.json({messages:messagesTo});
    } catch (e) {
        return next(e)
    }
})


/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/from', ensureCorrectUser, async (req, res, next) => {
    try {
        const messagesFrom = await User.messagesFrom(req.params.username);
        return res.json({messages:messagesFrom});
    } catch (e) {
        return next(e)
    }
})

module.exports = router;
