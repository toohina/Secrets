# 🔐 Secrets — Authentication & OAuth Demo App

## 📌 Project Overview
Secrets is a Node.js web application that demonstrates secure user authentication using multiple strategies:

- Local username & password authentication
- Google OAuth 2.0
- Facebook OAuth
- Session-based login
- Anonymous secret sharing

Users can register, log in, submit a secret, and view secrets submitted by others without revealing identities.

> This project was built to deeply understand authentication, authorization, sessions, OAuth, and MongoDB integration, not just to “make it work”.

---

## 🧠 Learning Goals
This project intentionally demonstrates:

- Why passwords should never be handled manually
- How Passport.js abstracts authentication complexity
- How OAuth providers replace password responsibility
- How sessions work under the hood
- How multiple authentication strategies can coexist in one app

---

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js — server & routing
- MongoDB — database
- Mongoose — ODM

### Authentication & Security
- Passport.js
- passport-local-mongoose
- express-session
- Google OAuth 2.0
- Facebook OAuth
- dotenv — environment variables

### Frontend
- EJS — server-side templating
- CSS — static styling

---

## 📁 Project Structure
```
Secrets/
│
├── public/
│   └── css/              # Static styles
│
├── views/                # EJS templates
│
├── app.js                # Main server file
├── package.json
├── package-lock.json
├── .gitignore
└── .env                  # Environment variables (not committed)
```

---

## 🔐 Environment Variables (.env)
Store sensitive credentials in environment variables (do not commit .env).

```
CLIENT_ID=your_google_client_id
CLIENT_SECRET=your_google_client_secret

APP_ID=your_facebook_app_id
APP_SECRET=your_facebook_app_secret
```

Why?
- Prevents accidental leaks on GitHub
- Follows industry security best practices
- Required by OAuth providers

---

## ⚙️ Core Concepts Explained (WHY + WHAT)

### 1️⃣ ES6 Configuration
```js
// jshint esversion:6
```
Why: Prevents linter errors for modern JavaScript syntax (const, arrow functions, etc.).

### 2️⃣ Loading Environment Variables
```js
require('dotenv').config();
```
Why: Loads secrets securely instead of hardcoding credentials in the source code.

### 3️⃣ Express App Setup
```js
const express = require("express");
const app = express();
```
Why: Express provides a minimal, flexible framework for routing and middleware.

### 4️⃣ Body Parsing
```js
app.use(bodyParser.urlencoded({ extended: true }));
```
Why: HTML forms send data as URL-encoded strings. This enables access via `req.body`.

### 5️⃣ Session Management
```js
app.use(session({
  secret: "Our little secret",
  resave: false,
  saveUninitialized: false
}));
```
Why these options:
- `secret` → signs session cookies
- `resave: false` → avoids unnecessary session updates
- `saveUninitialized: false` → prevents empty sessions

Sessions are essential because HTTP is stateless.

### 6️⃣ Passport Initialization
```js
app.use(passport.initialize());
app.use(passport.session());
```
Why:
- Initializes Passport
- Connects authentication to session handling

Without this, login and OAuth would fail.

---

## 🗄️ Database Design

### MongoDB Connection
```js
mongoose.connect("mongodb://localhost:27017/userDB");
```
Why: Uses a local MongoDB database for development and learning.

### User Schema
```js
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  googleId: String,
  facebookId: String,
  secret: String
});
```
Why each field exists:
- `username` — Required by Passport
- `password` — Local authentication
- `googleId` — Google OAuth users
- `facebookId` — Facebook OAuth users
- `secret` — App-specific feature

### Schema Plugins
```js
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
```
Why:
- `passport-local-mongoose` handles hashing, salting, login, and registration
- `findOrCreate` simplifies OAuth user handling

This avoids writing insecure or repetitive authentication logic.

---

## 🔑 Authentication Strategies

### Local Authentication
```js
passport.use(User.createStrategy());
```
Why: Delegates password handling entirely to Passport (best practice).

### Google OAuth 2.0
- Redirects user to Google
- Google verifies identity
- App receives profile info
- `User.findOrCreate({ googleId: profile.id })`

Why: OAuth users do not have passwords — identity is trusted from Google.

### Facebook OAuth
Works the same way as Google OAuth, demonstrating multiple providers in one app.

---

## 🔁 Session Serialization
```js
passport.serializeUser(...)
passport.deserializeUser(...)
```
Why:
- Store only user ID in session (lightweight)
- Fetch full user data on each request

---

## 🧭 Routes Explained

- `/` — Home page
- `/register` — Registers new users  
  Password hashing handled automatically by Passport
- `/login` — Logs users in using Passport  
  No manual password comparison
- `/secrets` — `User.find({ secret: { $ne: null } })`  
  Displays only submitted secrets, not user identities — anonymous sharing.
- `/submit` — `if (req.isAuthenticated())`  
  Only authenticated users can submit secrets.
- `/logout` — `req.logout();`  
  Destroys session and logs the user out securely.

---

## 🚀 Running the Project Locally
```bash
git clone https://github.com/toohina/Secrets.git
cd Secrets
npm install
node app.js
```

Visit: http://localhost:3000

---

## 🔒 Security Notes
- Passwords are never stored in plain text
- OAuth removes password responsibility from the app
- Secrets are stored securely using sessions and environment variables

---

## 📌 Final Notes
This project is intentionally designed as a learning-focused authentication system, demonstrating:
- Correct security practices
- Clean separation of concerns
- Real-world authentication flows

It is not shortcut code, but proper foundational backend architecture.
