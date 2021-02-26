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
const methodOverride=require('method-override');

//Connect to MongoUri
const keys= require('./config/keys');
const Users = require('./models/users');
const Post= require('./models/post');

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
app.use(methodOverride('_method'));
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
    Post.find({user: req.user._id})
    .populate('user')
    .then((posts) =>{
      res.render('profile',{
        posts:posts
      });
    });
    
});

//HANDLE ROUTE FOR ALLUSERS
app.get('/users',ensureAuthentication,(req,res) =>{
  Users.find({}).then((users)=>{
    res.render('users',{
      users:users
    });
  });
});

//DISPLAY USER PROFILE AFTER ALL
app.get('/user/:id',(req,res) =>{
  Users.findById({_id: req.params.id})
  .then((user)=>{
    res.render('user',{
      user:user
    });
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

//HANDLE PHONE POST ROUTE
app.post('/addPhone',(req,res) =>{
  const phone=req.body.phone;
  Users.findById({_id: req.user._id})
  .then((user) =>{
    user.phone =phone;
    user.save()
    .then(() =>{
      res.redirect('/profile');
    });
  });
});

//HANDLE LOCATION POST ROUTE
app.post('/addLocation',(req,res) =>{
  const location=req.body.location;
  Users.findById({_id: req.user._id})
  .then((user) =>{
    user.location =location;
    user.save()
    .then(() =>{
      res.redirect('/profile');
    });
  });
});

//HANDLE  GET ROUTES FOR POST
app.get('/addPost',(req,res) =>{
  res.render('addPost');
});

//HANDLE POST ROUTE FOR POST
app.post('/savePost', (req,res) =>{
  var allowComments;
  if(req.body.allowComments){
    allowComments=true;
  }else{
    allowComments=false;
  }
  const newPost={
    title:req.body.title,
    body:req.body.body,
    status: req.body.status,
    allowComments:allowComments,
    user: req.user._id
  }
  new Post(newPost).save()
  .then(() =>{
    res.redirect('/posts');
  });
});

//HANDLE EDIT ROUTE
app.get('/editPost/:id', (req,res)=>{
  Post.findOne({_id: req.params.id})
  .then((post) =>{
    res.render('editingPost', {
      post:post
    });
  });
});

//HANDLE PUT FOR EDITPOST
app.put('/editingPost/:id', (req,res) =>{
  Post.findOne({_id: req.params.id})
  .then((post) =>{
    var allowComments;
    if(req.body.allowComments){
      allowComments=true;
    }else{
      allowComments=false;
    }
    post.title= req.body.title;
    post.body=req.body.body;
    post.status= req.body.status;
    post.allowComments= allowComments;
    post.save()
    .then(() =>{
      res.redirect('/profile');
    });
  });
});


//HANDLE POSTS ROUTES
app.get('/posts',ensureAuthentication ,(req,res)=>{
  Post.find({status:'public'})
  .populate('user')
  .sort({date:'desc'})
  .then((posts)=>{
    res.render('publicPosts', {
      posts:posts
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
