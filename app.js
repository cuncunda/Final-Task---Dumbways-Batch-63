const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");
const multer = require("multer");
const { engine } = require("express-handlebars");
const pool = require("./database");

const app = express();
const port = 3000;

// multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "public/uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// midware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

// hbs
app.engine("hbs", engine({ extname: ".hbs" }));
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// data
let experiences = [];
let projects = [];

// midware login
function isLoggedIn(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/login");
}

// rout

app.get("/", (req, res) => {
  console.log("Current user:", req.session.user);
  res.render("home", {
    layout: "main",
    title: "Final Task",
    experiences,
    projects,
    user: req.session.user || null,
  });
});

// Login
app.get("/login", (req, res) => {
  res.render("login", {
    title: "Login",
    layout: false,
  });
});

// pros login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  if (result.rows.length === 0) return res.send("User not found");

  const user = result.rows[0];
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) return res.send("pass salah!");

  req.session.user = user;
  console.log("User logged in:", user.name);
  res.redirect("/");
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// Debug route (hapus session lama)
app.get("/clear-session", (req, res) => {
  req.session.destroy(() => res.send("Session cleared"));
});

// Experience
app.post("/add-experience", isLoggedIn, upload.single("logo"), (req, res) => {
  const { title, company, date, description } = req.body;
  const logo = req.file ? `/uploads/${req.file.filename}` : null;

  experiences.unshift({ title, company, date, description, logo });
  console.log("Experience added:", experiences);
  res.redirect("/");
});

// Projects
app.post("/add-project", isLoggedIn, upload.single("image"), (req, res) => {
  const { title, techStack, description } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  projects.unshift({
    title,
    techStack: techStack ? techStack.split(",").map((t) => t.trim()) : [],
    description,
    image,
  });

  console.log("Project added:", projects);
  res.redirect("/");
});

// Start Server
app.listen(port, () => {
  console.log(`jalan di http://localhost:${port}`);
});
