const express = require("express");
const app = express();
const userModel = require("./models/user");

const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const path = require("path");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const bodyParser = require("body-parser");
const session = require("express-session");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const cors = require("cors");
require("dotenv").config();   // ✅ Load .env file

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(session({ secret: "otp-secret", resave: false, saveUninitialized: true }));
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.static("public"));


// ---- MANUAL REGISTER ----
app.post("/api/create", async (req, res) => {
  const { username, email, password, age } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    await userModel.create({
      username,
      email,
      password: hash,
      age,
    });

    let token = jwt.sign({ email }, "shhshshshshh", { expiresIn: "1h" });
    res.cookie("token", token, { httpOnly: true });
    res.json({ message: "User created successfully", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creating user" });
  }
});

// ---- LOGIN FLOW USING EMAIL VERIFICATION ----
app.post("/api/send-login-verification", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  const user = await userModel.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  user.loginToken = token;
  user.loginTokenExpires = expiresAt;
  await user.save();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "lalwanibhumi91@gmail.com",
      pass: process.env.APP_PASSWORD,   // ✅ from .env
    },
  });

  const verifyLinkYes = `http://localhost:3000/api/verify-login?token=${token}&action=yes`;
  const verifyLinkNo = `http://localhost:3000/api/verify-login?token=${token}&action=no`;

  await transporter.sendMail({
    from: `"My App" <lalwanibhumi91@gmail.com>`,
    to: email,
    subject: "Login Verification",
    html: `
      <p>We noticed a login attempt to your account.</p>
      <p>Click below to verify:</p>
      <a href="${verifyLinkYes}">Yes, it’s me</a>
      <a href="${verifyLinkNo}">No, it’s not me</a>
    `,
  });

  res.json({ message: "Verification email sent. Check your inbox!" });
});

app.get("/api/verify-login", async (req, res) => {
  const { token, action } = req.query;

  const user = await userModel.findOne({ loginToken: token });
  if (!user) return res.send("Invalid or expired link");

  if (Date.now() > new Date(user.loginTokenExpires)) {
    user.loginToken = null;
    user.loginTokenExpires = null;
    await user.save();
    return res.send("Link expired. Please try logging in again.");
  }

  if (action === "yes") {
    const jwtToken = jwt.sign({ email: user.email }, "shhshshshshh", { expiresIn: "1h" });
    res.cookie("token", jwtToken, { httpOnly: true });
    console.log("✅ Login successful! You can now go back to the app.");
    res.redirect("http://localhost:5173/?login=success");
  } else {
    res.send("⚠️ Login denied. If this wasn't you, secure your account.");
  }

  user.loginToken = null;
  user.loginTokenExpires = null;
  await user.save();
});

// ---- GOOGLE STRATEGY ----
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,     // ✅ from .env
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;

        let user = await userModel.findOne({ email });
        if (!user) {
          user = await userModel.create({
            username: name,
            email,
            password: "", 
            age: null,
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

app.use(passport.initialize());

app.get("/login_with_google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  (req, res) => {
    let token = jwt.sign({ email: req.user.email }, "shhshshshshh", { expiresIn: "1h" });
    res.cookie("token", token, { httpOnly: true });
    res.redirect("http://localhost:5173"); 
  }
);

// ---- GITHUB STRATEGY ----
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,       // ✅ from .env
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    return done(null, profile);
  }
));

app.get("/login_with_github", passport.authenticate("github", { scope: ["user:email"] }));

app.get("/auth/github/callback",
  passport.authenticate("github", { session: false, failureRedirect: "/" }),
  (req, res) => {
    let token = jwt.sign({ email: req.user.emails[0].value }, "shhshshshshh", { expiresIn: "1h" });
    res.cookie("token", token, { httpOnly: true });
    res.redirect("http://localhost:5173"); 
  }
);

// ---- LOGOUT ----
app.get("/api/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});


// Serve React build (only in production)
app.use(express.static(path.join(__dirname, "frontend/dist")));
app.get(/.*/, (req, res) => {
  res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
});


app.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});
