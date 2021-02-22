// Load Modules
const express= require('express');
const exphbs= require('express-handlebars');
const mongoose= require('mongoose');

//Connect to MongoUri
const keys= require('./config/keys');

//initialise application
const app= express();

//setup template
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

// Setup static file to serve css, js amd images
app.use(express.static('public'));

//connect to remote databse
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
app.get('/',(req,res)=> {
    res.render('home');
});

app.get('/about',(req,res)=>{
    res.render('about');
});

app.listen(port,()=>{
    console.log(`Server is running by nodemon on port ${port}`);
});
