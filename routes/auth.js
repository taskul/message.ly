const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const {SECRET_KEY, SECRET_KEY_2} = require('../config');
const ExpressError = require('../expressError');


router.get('/login', (req, res, next) => {
    try {
        return res.render('user/login.html');
      } catch (err) {
        return next(err);
      }
})

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
            // adding token to the session
            req.session.token = token;
            // 60000 is one minute
            // setting expiration time to 30 seconds to make it easier to test
            req.session.cookie.maxAge = 30000;
            return res.status(302).redirect(`/users/${username}`); 
        } else {
            throw new ExpressError("Invalid username/password", 400)
          }
    } catch (e) {
        return next(e)
    }
})

router.get("/logout", (req, res, next) => {
    // clear the user from the session object and save.
    // this will ensure that re-using the old session id
    // does not have a logged in user
    req.user = null;
    req.session.save(function (err) {
        if (err) next(err)
    // regenerate the session, which is good practice to help
    // guard against forms of session fixation
    req.session.regenerate(function (err) {
        if (err) next(err)
        res.redirect('/')
    })
    })
})

router.get('/register', async (req, res, next) => {
    try {
        return res.render('user/register.html');
      } catch (err) {
        return next(err);
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
        let token = jwt.sign({username}, SECRET_KEY);
        User.updateLoginTimestamp(username)
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 5000,
            sameSite:'strict',
        })
        return res.status(302).redirect(`/users/${username}`);
    
    } catch (e) {
        if (e.code === '23505') {
            return next(new ExpressError('Username taken, Please pick another!', 400));
          }
        return next(e)
    }
})

module.exports = router;