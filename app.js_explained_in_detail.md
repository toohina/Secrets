# Secrets

A small Express + MongoDB app that allows users to register, log in (locally or via Google/Facebook), and anonymously submit secrets that are displayed to others.

This README documents setup, running, routes, environment variables, and contains a detailed line-by-line explanation of `app.js`.

---

## Features

- Local authentication (username/password) using passport-local-mongoose
- OAuth login via Google and Facebook
- Session management with `express-session`
- Store user data and secrets in MongoDB via Mongoose
- Public page showing submitted secrets
- Simple EJS views for pages (home, login, register, secrets, submit)

---

## Requirements

- Node.js (v14+ recommended)
- npm
- MongoDB (local or remote)
- OAuth credentials (Google and/or Facebook) if you want OAuth sign-in

---

## Install

1. Clone the repo:
   ```
   git clone https://github.com/toohina/Secrets.git
   cd Secrets
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in project root with the required environment variables (see below).

4. Start MongoDB (if using local):
   ```
   mongod
   ```

5. Run the app:
   ```
   node app.js
   ```
   or with nodemon:
   ```
   npx nodemon app.js
   ```

The server listens on port `3000` by default (http://localhost:3000).

---

## Environment variables

Create a `.env` file and set the following variables as needed:

- `CLIENT_ID` — Google OAuth Client ID (for Google sign-in)
- `CLIENT_SECRET` — Google OAuth Client Secret
- `APP_ID` — Facebook App ID (for Facebook sign-in)
- `APP_SECRET` — Facebook App Secret
- (Optional) `SECRET` — secret key if using field-encryption plugin (commented out in the current code)

Important: Do not commit `.env` to source control.

---

## Main routes

- `GET /` — home page
- `GET /login` — login page
- `GET /register` — register page
- `GET /secrets` — view all non-null secrets (publicly viewable)
- `GET /submit` — submit secret page (requires authentication)
- `POST /submit` — submit a secret (requires authentication)
- `GET /logout` — log out
- `GET /auth/google` — start Google OAuth
- `GET /auth/google/secrets` — Google OAuth callback
- `GET /auth/facebook` — start Facebook OAuth
- `GET /auth/facebook/secrets` — Facebook OAuth callback

---

## Notes & recommendations

- Session secret is hard-coded in the code (`"Our little secret"`). Move this to `.env` (`SESSION_SECRET`) for production and use a secure random string.
- Several commented-out blocks show alternative approaches (bcrypt, md5, mongoose-encryption). The current active code uses `passport-local-mongoose` for local auth and `passport-google-oauth2` + `passport-facebook` for OAuth.
- The `/secrets` page shows all submitted secrets publicly. If you want private secrets, add authentication checks.
- Consider adding input validation/sanitization, better error messages for users, and CSRF protection / rate limiting for production.
- Some Mongoose options like `useCreateIndex` may be deprecated depending on your Mongoose version; check documentation if you upgrade.

---

## Detailed explanation of app.js (line-by-line)

Below is an annotated, line-by-line explanation of the `app.js` file. Commented lines shown in the file are explained as older/alternate approaches.

- `//jshint esversion:6`
  - JSHint directive indicating ES6+. No runtime effect.

- `require('dotenv').config();`
  - Loads `.env` environment variables into `process.env` using `dotenv`.

- `const express = require("express");`
  - Imports Express.

- `const bodyParser = require("body-parser");`
  - Imports `body-parser` to parse form and JSON request bodies. (Note: modern Express has built-in body parsing.)

- `const mongoose = require("mongoose");`
  - Imports Mongoose for MongoDB interactions.

- `const ejs = require("ejs");`
  - Imports EJS templating engine.

- `const session = require("express-session");`
  - Imports session middleware.

- `const passport = require("passport");`
  - Imports Passport for authentication.

- `const passportLocalMongoose = require("passport-local-mongoose");`
  - Passport plugin that hooks Mongoose into passport-local.

- `var GoogleStrategy = require('passport-google-oauth2').Strategy;`
  - Google OAuth2 strategy constructor.

- `var FacebookStrategy = require('passport-facebook').Strategy;`
  - Facebook OAuth strategy constructor.

- `var findOrCreate = require('mongoose-findorcreate')`
  - Mongoose plugin providing `findOrCreate` helper — useful for OAuth flows.

- Commented-out lines (examples/alternatives):
  - `// const bcrypt = require("bcrypt");` — previously used for password hashing.
  - `// const saltRounds = 10;`
  - `// const md5=require("md5");`
  - `// const encrypt=require("mongoose-encryption");`
  - These are alternate/older approaches left in comments.

- `const app = express();`
  - Create Express app instance.

- `app.use(bodyParser.urlencoded({ extended: true }));`
  - Parse URL-encoded bodies (form submissions). `extended: true` allows nested objects.

- Session middleware:
  ```
  app.use(session({
    secret: "Our little secret",
    resave: false,
    saveUninitialized: false
  }));
  ```
  - Configures session; `secret` should be an env var in production.

- `app.use(passport.initialize());`
  - Initialize Passport middleware.

- `app.use(passport.session());`
  - Integrate Passport with session support (serialize/deserialize).

- Google OAuth strategy registration:
  ```
  passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    passReqToCallback : true,
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(request, accessToken, refreshToken, profile, done) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id, username: profile.id }, function (err, user) {
      return done(err, user);
    });
  }));
  ```
  - Uses `CLIENT_ID` and `CLIENT_SECRET` from `.env`.
  - `userProfileURL` override sometimes fixes profile fetching issues.
  - The verify callback logs the profile and uses `findOrCreate` to persist/lookup user by `googleId`.

- Facebook OAuth strategy registration:
  ```
  passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }));
  ```
  - Uses `APP_ID` and `APP_SECRET` from `.env`.
  - Verify callback uses `findOrCreate` to lookup/create user by `facebookId`.

- `app.set('view engine', "ejs");`
  - Configure EJS as view engine.

- `app.use(express.static("public"));`
  - Serve static assets from `public` folder.

- Mongoose connect:
  ```
  mongoose.connect("mongodb://localhost:27017/userDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  });
  ```
  - Connects to local MongoDB database `userDB`. Some options may be deprecated depending on Mongoose version.

- User schema:
  ```
  const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: String
  });
  ```
  - Fields for local and OAuth authentication plus a `secret` field for user-submitted content.

- Plugins added to schema:
  - `userSchema.plugin(findOrCreate);` — adds `findOrCreate`.
  - `userSchema.plugin(passportLocalMongoose, { usernameUnique: false });` — adds local auth helpers and hashing. `usernameUnique: false` disables the plugin creating a unique index for username.
  - Commented out: `// userSchema.plugin(encrypt,{secret:process.env.SECRET , encryptedFields:['password']});`

- Model:
  - `const User = new mongoose.model("User", userSchema);`

- Passport local strategy:
  - `passport.use(User.createStrategy());` — use passport-local-mongoose's strategy for username/password auth.

- Passport session handling:
  ```
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
  ```
  - Serialize the MongoDB `_id` into the session; deserialize by finding user by id.

- Facebook auth routes:
  - Start: `app.get('/auth/facebook', passport.authenticate('facebook'));`
  - Callback:
    ```
    app.get('/auth/facebook/secrets',
      passport.authenticate('facebook', { failureRedirect: '/login' }),
      function(req, res) {
        res.redirect('/secrets');
      });
    ```

- Google auth routes:
  - Start:
    ```
    app.get("/auth/google",
      passport.authenticate('google', { scope: ['profile'] }));
    ```
  - Callback:
    ```
    app.get('/auth/google/secrets',
      passport.authenticate('google', { successRedirect: '/secrets', failureRedirect: '/login' }));
    ```

- Basic pages routes:
  - `GET /` → renders `home`
  - `GET /login` → renders `login`
  - `GET /register` → renders `register`

- `GET /secrets`:
  ```
  app.get("/secrets", function(req, res) {
    User.find({ "secret": { $ne: null } }, function(err, foundUsers) {
      if (err) {
        console.log(err);
      } else {
        if (foundUsers) {
          res.render("secrets", { usersWithSecrets: foundUsers });
        }
      }
    });
  });
  ```
  - Finds users whose `secret` is not null and renders them publicly.

- `GET /submit`:
  ```
  app.get("/submit", function(req, res) {
    if (req.isAuthenticated()) {
      res.render("submit");
    } else {
      res.redirect("/login");
    }
  });
  ```
  - Require authentication for secret submission page.

- `POST /submit`:
  ```
  app.post("/submit", function(req, res) {
    const submittedSecret = req.body.secret;
    var userId = req.user.id;

    User.findById(userId, function(err, user) {
      if (!err) {
        user.secret = submittedSecret;
        user.save(function() {
          res.redirect("/secrets");
        });
      }
    });
  });
  ```
  - Saves `secret` to the authenticated user's document then redirects to `/secrets`.

- Registration route (`POST /register`):
  ```
  User.register({ username: req.body.username }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });
  ```
  - Uses `passport-local-mongoose` helper to create a new user and hash the password; then logs the user in.

- Login route (`POST /login`):
  ```
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });
  ```
  - Uses Passport to authenticate credentials and redirect on success.

- Logout:
  ```
  app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
  });
  ```

- Start server:
  ```
  app.listen(3000, function() {
    console.log("Server starting at port 3000!");
  });
  ```

---

