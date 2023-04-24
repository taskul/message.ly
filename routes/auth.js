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
        const user = await User.authenticate(username,password)
        if (user) {
            const token = jwt.sign({username}, SECRET_KEY);
            return res.json({msg:"You successfully logged in", token})  
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
        if (user) {
            const token = jwt.sign({username}, SECRET_KEY);
            return res.json({msg:"You have successfully registered!", token})
        }
    } catch (e) {
        return next(e)
    }
})

module.exports = router;