/** Express app for message.ly. */
const express = require("express");
const cors = require("cors");
const { authenticateJWT } = require("./middleware/auth");
const nunjucks = require('nunjucks');
const session = require('express-session')
const ExpressError = require("./expressError")
const app = express();
const {SECRET_KEY_2} = require('./config')

// allow both form-encoded and json body parsing
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//HTML templating
nunjucks.configure("templates", {
  autoescape:true,
  express:app
});

// setting so we could use static folder directory for CSS and JS files
app.use(express.static(__dirname + '/'));

app.use(session({
  secret: SECRET_KEY_2,
  resave: false,
  saveUninitialized: true
}))


// get auth token for all routes
app.use(authenticateJWT);

// allow connections to all routes from any browser
app.use(cors());
/** routes */

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const messageRoutes = require("./routes/messages");

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/messages", messageRoutes);

app.get('/', async (req, res, next) => {
  return res.render('index.html')
})

/** 404 handler */

app.use(function(req, res, next) {
  const err = new ExpressError("Not Found", 404);
  return next(err);
});

/** general error handler */

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  if (process.env.NODE_ENV != "test") console.error(err.stack);

  // return res.json({
  //   error: err,
  //   message: err.message
  // });
  
  // more friendly messages that are sent to the client
  return res.render('base.html', {errors :[err.status, err.message]})
});


module.exports = app;
