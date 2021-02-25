// Load Modules
const express= require('express');
const Handlebars= require('handlebars');
const exphbs= require('express-handlebars');
const {allowInsecurePrototypeAccess} =require(`@handlebars/allow-prototype-access`);
const mongoose= require('mongoose');
const passport= require('passport');
const session = require("express-session");
const bodyParser = require('body-parser');
const cookieParser= require('cookie-parser');

//Connect to MongoUri
const keys= require('./config/keys');
const Users = require('./models/users');

require('./passport/google-passport');
require('./passport/facebook-passport');

//Link Helpers
const {
  ensureAuthentication,
  ensureGuest
}= require('./helpers/auth');

//initialise application
const app= express();
//Express config
app.use(cookieParser());
app.use(bodyParser.urlencoded({
      extended: false
  }));
app.use(bodyParser.json());
app.use(session({ secret: 'keyboard cat' ,
resave: true,
saveUninitialized:true
}));
app.use(passport.initialize());
app.use(passport.session());

//set global variable for user
app.use((req,res,next) =>{
    res.locals.user =req.user || null;
    next();
});

//setup template
app.engine('handlebars', exphbs({
    defaultLayout: 'main',
    handlebars: allowInsecurePrototypeAccess(Handlebars)
}));
app.set('view engine', 'handlebars');

// Setup static file to serve css, js amd images
app.use(express.static('public'));

//connect to remote databse
mongoose.Promise = global.Promise;
mongoose.connect(keys.MongoURI,{
    useNewUrlParser: true
})
.then(() =>{
    console.log(`Connected to Remote Databse`);
}).catch((err) =>{
    console.log(err);

});

// set environment variable
const port= process.env.PORT || 3000;

// handle routes
app.get('/', ensureGuest ,(req,res)=> {
    res.render('home');
});

app.get('/about',(req,res)=>{
    res.render('about');
});

//Google auth route
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/l' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/profile');
  });

//Facebook AUTH Route
app.get('/auth/facebook',
  passport.authenticate('facebook',{scope:['email']}));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/profile');
  });

app.get('/profile', ensureAuthentication ,(req,res) =>{
    Users.findById({_id: req.user._id})
    .then((user) =>{
        res.render('profile', {
            user: user});
    });
    
});

//Handle Email POST route
app.post('/addEmail',(req,res) =>{
  const email=req.body.email;
  Users.findById({_id: req.user._id})
  .then((user) =>{
      user.email=email;
      user.save()
      .then(()=>{
        res.redirect('/profile');
      });
  });
});

//Handle user logout route
app.get('/logout', (req,res) =>{
    req.logout();
    res.redirect('/');
});

app.listen(port,()=>{
    console.log(`Server is running by nodemon on port ${port}`);
});
