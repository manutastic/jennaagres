var express = require("express"),
    mongoose = require("mongoose"),
    bodyParser = require("body-parser"),
    sass = require("node-sass"),
    slug = require("mongoose-slug-generator"),
    methodOverride = require("method-override"),
    multer = require("multer"),
    app = express();

// App Config
mongoose.connect("mongodb://localhost:27017/jenna_agres", { useNewUrlParser: true })
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));


// Multer Config
const multerConfig = {

    storage: multer.diskStorage({
        //Setup where the user's file will go
        destination: function (req, file, cb) {
            cb(null, 'public/uploads')
          },

        //Then give the file a unique name
        filename: function (req, file, next) {
            console.log(file);
            const ext = file.mimetype.split('/')[1];
            next(null, file.fieldname + '-' + Date.now() + '.' + ext);
        }
    }),

    //A means of ensuring only images are uploaded. 
    fileFilter: function (req, file, next) {
        if (!file) {
            next();
        }
        const image = file.mimetype.startsWith('image/');
        if (image) {
            console.log('photo uploaded');
            next(null, true);
        } else {
            console.log("file not supported");

            //TODO:  A better message response to user on failure.
            return next();
        }
    }
};
var upload = multer(multerConfig);


// Schema/Model Config
mongoose.plugin(slug);
var projectSchema = new mongoose.Schema({
    title: String,
    date: { type: Date, default: Date.now },
    desc: String,
    images: [String],
    thumb: String,
    collections: [String],
    slug: { type: String, slug: "title", slug_padding_size: 2, unique: true }
});
var Project = mongoose.model("Project", projectSchema);


// Routes
app.get("/", function (req, res) {
    Project.find({}, function (err, projects) {
        if (err) console.log(err);
        else res.render("index", { projects: projects });
    });
});

app.post("/projects", upload.fields([{ name: 'thumb'}, { name: 'images'}]), function (req, res) {
    var object = req.body.project;
    object.thumb = "/uploads/" + req.files['thumb'][0].filename;
    object.images = [];
    req.files['images'].forEach(function(image){
        object.images.push("/uploads/" + image.filename);
    });
    Project.create(object, function (err, newProject) {
        if (err) {
            console.log(err);
            res.redirect("/projects/new");
        } else {
            res.redirect("/");
        }
    });
});

app.get("/projects/new", function (req, res) {
    res.render("new");
})

app.get("/projects/edit", function (req, res) {
    Project.find({}, function (err, projects) {
        if (err) console.log(err);
        else res.render("admin", { projects: projects });
    });
})

app.get("/projects/:slug", function (req, res) {
    Project.findOne({ slug: req.params.slug }, function (err, project) {
        if (err) { res.redirect("/") }
        else {
            //console.log(foundProject);
            res.render("project", { project: project });
        }
    });
})

app.get("/projects/:slug/edit", function (req, res) {
    Project.findOne({ slug: req.params.slug }, function (err, project) {
        if (err) {
            res.redirect("/");
            console.log(err);
        } else {
            res.render("edit", { project: project });
        }
    });
})

app.put("/projects/:slug", function (req, res) {
    var object = req.body.project;
    object.thumb = "/uploads/" + req.files['thumb'][0].filename;
    object.images = [];
    req.files['images'].forEach(function(image){
        object.images.push("/uploads/" + image.filename);
    });
    Project.findOneAndUpdate({ slug: req.params.slug }, object, function (err, project) {
        if (err) { res.redirect("/") }
        else {
            res.redirect("/projects/" + req.params.slug);
        }
    });
});

app.delete("/projects/:slug", function (req, res) {
    Project.findOneAndRemove({ slug: req.params.slug }, function (err) {
        if (err) { res.redirect("/") }
        else {
            res.redirect("/projects/edit");
        }
    });
});

app.get("*", function (req, res) {
    res.send("404: Page not found :(");
});

app.listen("3000", function () {
    console.log("Jenna Agres server is listening on port 3000");
});