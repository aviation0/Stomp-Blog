var express         = require("express"),
  methodOverride    = require("method-override"),
  expressSanitizer  = require("express-sanitizer"),
  app               = express(),
  bodyParser        = require("body-parser"),
  mongoose          = require("mongoose"),
  passport          = require("passport"),
  LocalStrategy     = require("passport-local"),
  Blog              = require("./models/blog"),
  User              = require("./models/user");

// APP CONFIG
mongoose.connect("mongodb://localhost/restful_blog_app");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer()); //after body-parser always
app.use(methodOverride("_method"));

//PASSPORT CONFIG
app.use(require("express-session")({
  secret: "I will use this statement now",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
  res.locals.currentUser = req.user;
  next();
});

//RESTFUL ROUTES

app.get("/", function(req, res) {
  res.redirect("/blogs");
});

//INDEX ROUTE
app.get("/blogs", function(req, res){
  Blog.find({}, function(err, blogs){
    if(err){
      console.log(err);
    } else {
      res.render("index", {blogs: blogs});
    }
  });
});

//NEW ROUTE
app.get("/blogs/new", isLoggedIn, function(req, res) {
  res.render("new");    
});

//CREATE ROUTE
app.post("/blogs", function(req, res){
  //create blog
  req.body.blog.body = req.sanitize(req.body.blog.body);
  Blog.create(req.body.blog, function(err, newBlog){
    if(err){
      res.render("new");
    } else {
      res.redirect("/blogs");
    }
  });
  //then redirect
});

//SHOW ROUTE
app.get("/blogs/:id", function(req, res) {
   Blog.findById(req.params.id, function(err, foundBlog){
     if(err){
       res.redirect("/blogs");
     } else {
       res.render("show", {blog: foundBlog});
     }
   });
});

//EDIT ROUTE
app.get("/blogs/:id/edit", isLoggedIn, function(req, res){
  Blog.findById(req.params.id, function(err, foundBlog){
    if(err){
      res.redirect("/blogs");
    } else {
      res.render("edit", {blog: foundBlog});
    }
  });
});

//UPDATE ROUTE
app.put("/blogs/:id", function(req, res){
  req.body.blog.body = req.sanitize(req.body.blog.body);
  Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, updatedBlog){
    if(err){
      res.redirect("/blogs");
    } else {
      res.redirect("/blogs/" + req.params.id);
    }
  });
});

//DELETE ROUTE
app.delete("/blogs/:id", isLoggedIn, function(req,res){
  //destroy blog
  Blog.findByIdAndRemove(req.params.id, function(err){
    if(err){
      res.redirect("/blogs");
    } else {
      res.redirect("/blogs");
    }
  });
});

//=========================
//AUTHENTICATION ROUTES
//=========================

app.get("/register", function(req, res) {
   res.render("register");
});

app.post("/register", function(req, res){
  var newUser = new User({username: req.body.username});
  User.register(newUser, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect("register");
    }
    passport.authenticate("local")(req, res, function(){
      res.redirect("/blogs");
    });
  });
});

// Show Login Form
app.get("/login", function(req, res) {
  res.render("login");    
});

app.post("/login", passport.authenticate("local", 
  {
   successRedirect : "/blogs",
   failureRedirect : "/login"
  }), function(req, res) {
  
});

//log out 
app.get("/logout", function(req, res) {
   req.logout();
   res.redirect("/blogs");
});

function isLoggedIn(req, res, next){
 if(req.isAuthenticated()){
   return next();
 }
 res.redirect("/login");
}

app.listen(process.env.PORT, process.env.IP, function(){
  console.log("SERVER IS RUNNING!");
});