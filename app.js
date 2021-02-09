//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
var GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
var FacebookStrategy=require('passport-facebook').Strategy;
var findOrCreate = require('mongoose-findorcreate')
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
// const md5=require("md5");
// const encrypt=require("mongoose-encryption");


const app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


passport.use(new GoogleStrategy({
  clientID:    process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  passReqToCallback   : true,
  userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
},
function(request, accessToken, refreshToken, profile, done) {
  console.log(profile);
  User.findOrCreate({ googleId: profile.id,username:profile.id }, function (err, user) {
    return done(err, user);
  });
}
));

passport.use(new FacebookStrategy({
  clientID: process.env.APP_ID,
  clientSecret: process.env.APP_SECRET,
  callbackURL: "http://localhost:3000/auth/facebook/secrets"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ facebookId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

app.set('view engine', "ejs");
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
});



const userSchema = new mongoose.Schema({
  username:String,
  email: String,
  password: String,
  googleId:String,
  facebookId:String,
  secret:String
});
userSchema.plugin(findOrCreate);
userSchema.plugin(passportLocalMongoose,{usernameUnique: false});
// userSchema.plugin(encrypt,{secret:process.env.SECRET , encryptedFields:['password']});

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/auth/google", passport.authenticate('google', {

  scope: ['profile']

}));

app.get( '/auth/google/secrets',
    passport.authenticate( 'google', {
        successRedirect: '/secrets',
        failureRedirect: '/login'
}));

app.get("/", function(req, res) {
  res.render("home");
});


app.get("/login", function(req, res) {
  res.render("login");
});


app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/secrets", function(req, res) {
 User.find({"secret":{$ne:null}},function(err,foundUsers){
  if(err){
    console.log(err);
  }else{
    if(foundUsers){
      res.render("secrets",{usersWithSecrets:foundUsers});
    }
  }
 });
});

app.get("/submit",function(req,res){
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit",function(req,res){
  const submittedSecret=req.body.secret;
  var userId=req.user.id;
  User.findById(userId,function(err,user){
    if(!err){
      user.secret=submittedSecret;
      user.save(function(){
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/register", function(req, res) {
  // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
  //   const newUser = new User({
  //     email: req.body.username,
  //     password: hash
  //   });
  //   newUser.save(function(err) {
  //     if (err) console.log(err);
  //     else {
  //       res.render("secrets");
  //     }
  //   });
  // });
  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        console.log(user);
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login", function(req, res) {
  // User.findOne({
  //     email: req.body.username
  //   }, function(err, foundUser) {
  //     if (err) console.log(err);
  //     else {
  //       if (foundUser) {
  //         bcrypt.compare(req.body.password, foundUser.password, function(err, result) {
  //           if (result === true) res.render("secrets")
  //         });
  //       } else console.log("User not found");
  //     }
  // });
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
});

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

app.listen(3000, function() {
  console.log("Server starting at port 3000!");
})
