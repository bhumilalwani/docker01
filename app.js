import express from "express";
import userModel from "./models/user.js";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import path from "path";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import bodyParser from "body-parser";
import session from "express-session";
import nodemailer from "nodemailer";
import crypto from "crypto";
import cors from "cors";
import "dotenv/config";
import { createClient } from "redis";
import mongoose from "mongoose";

// __dirname workaround for ES modules
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------- Redis Setup ----------------
const client = createClient({ url: "redis://redis:6379" }); // use Docker container name
client.on("error", (err) => console.error("Redis Client Error", err));
await client.connect();


const app = express();
async function startServer() {
  // ---------------- Connect Redis ----------------
  await client.connect();
  await client.set("user:1", "Bhumi");
  const redisValue = await client.get("user:1");
  console.log("Redis value:", redisValue);

// ---------------- Connect MongoDB ----------------
// Close any existing mongoose connections
if (mongoose.connection.readyState !== 0) {
  await mongoose.disconnect();
}

const mongoUri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/mydb';
console.log('Connecting to MongoDB:', mongoUri);
await mongoose.connect(mongoUri, { 
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

  console.log("✅ MongoDB connected");

  // ---------------- Middlewares ----------------
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(session({ secret: "otp-secret", resave: false, saveUninitialized: true }));
  app.use(cors({ origin: "http://localhost:5173", credentials: true }));
  app.use(express.static("public"));

  // ---------------- Routes ----------------
  app.post("/api/create", async (req, res) => {
    const { username, email, password, age } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: "Missing fields" });

    try {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      await userModel.create({ username, email, password: hash, age });

      const token = jwt.sign({ email }, "shhshshshshh", { expiresIn: "1h" });
      res.cookie("token", token, { httpOnly: true });
      res.json({ message: "User created successfully", token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error creating user" });
    }
  });

  app.post("/api/send-login-verification", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.loginToken = token;
    user.loginTokenExpires = expiresAt;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: "lalwanibhumi91@gmail.com", pass: process.env.APP_PASSWORD },
    });

    const verifyLinkYes = `http://localhost:3000/api/verify-login?token=${token}&action=yes`;
    const verifyLinkNo = `http://localhost:3000/api/verify-login?token=${token}&action=no`;

    await transporter.sendMail({
      from: `"My App" <lalwanibhumi91@gmail.com>`,
      to: email,
      subject: "Login Verification",
      html: `<p>We noticed a login attempt to your account.</p>
             <p>Click below to verify:</p>
             <a href="${verifyLinkYes}">Yes, it’s me</a> |
             <a href="${verifyLinkNo}">No, it’s not me</a>`
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
      console.log("✅ Login successful!");
      res.redirect("http://localhost:5173/?login=success");
    } else {
      res.send("⚠️ Login denied. If this wasn't you, secure your account.");
    }

    user.loginToken = null;
    user.loginTokenExpires = null;
    await user.save();
  });

  // ---------------- Passport Strategies ----------------
  passport.use(
    new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;
        let user = await userModel.findOne({ email });
        if (!user) {
          user = await userModel.create({ username: name, email, password: "", age: null });
        }
        return done(null, user);
      } catch (err) { return done(err, null); }
    })
  );

  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/github/callback"
  }, (accessToken, refreshToken, profile, done) => done(null, profile)));

  app.use(passport.initialize());

  // ---------------- Logout ----------------
  app.get("/api/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
  });

  // ---------------- Serve React Frontend ----------------
  app.use(express.static(path.join(__dirname, "frontend/dist")));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });

  // ---------------- Start Server ----------------
  app.listen(3000, "0.0.0.0", () => {
    console.log("✅ Server running on http://localhost:3000");
  });
}

// startServer().catch(err => console.error("Server startup error:", err));
