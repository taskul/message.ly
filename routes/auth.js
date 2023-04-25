const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const {SECRET_KEY} = require('../config');
const ExpressError = require('../expressError');

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async (req, res, next) => {
    try {
        const {username, password} = req.body;
        if (await User.authenticate(username,password)) {
            const token = jwt.sign({username}, SECRET_KEY);
            User.updateLoginTimestamp(username);
            return res.json({token});  
        } else {
            throw new ExpressError("Invalid username/password", 400)
          }
    } catch (e) {
        return next(e)
    }
})

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post('/register', async (req, res, next) => {
    try {
        const {username, password, first_name, last_name, phone} = req.body;
        if (!username || !password || !first_name || !last_name || !phone) {
            throw new ExpressError('Please fillout all of the required fields', 400);
        }
        const user = await User.register({username, password, first_name, last_name, phone});
        const token = jwt.sign({username}, SECRET_KEY);
        User.updateLoginTimestamp(username)
        return res.json({token})
    } catch (e) {
        if (e.code === '23505') {
            return next(new ExpressError('Username taken, Please pick another!', 400));
          }
        return next(e)
    }
})

module.exports = router;