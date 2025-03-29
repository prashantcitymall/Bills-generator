import express from "express";
import { join } from "path";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import { createClient } from "redis";
import { RedisStore } from "connect-redis";

// Load environment variables if .env file exists
try {
  dotenv.config();
} catch (err) {
  console.log("ENV: Failed to load .env file, using defaults");
}

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Check if we're in production mode
const isProduction = process.env.NODE_ENV === "production";
console.log(
  `CONFIG: Environment=${process.env.NODE_ENV}, Production=${isProduction}`
);

// Set the callback URL based on environment
const callbackURL = isProduction
  ? "https://billcreator.store/auth/google/callback"
  : "http://localhost:3001/auth/google/callback";

console.log(`AUTH: Using callback URL ${callbackURL}`);

// Initialize Redis client and session store
let redisClient;
let sessionStore;

// Setup Redis client based on environment
if (isProduction) {
  const redisHost = process.env.REDIS_HOST || "localhost";
  const redisPort = process.env.REDIS_PORT || 6379;

  console.log(`REDIS: Configuring connection to ${redisHost}:${redisPort}`);

  redisClient = createClient({
    url: `redis://${redisHost}:${redisPort}`,
  });

  redisClient.on("error", (err) => {
    console.error(`REDIS: Connection error - ${err.message}`);
  });

  redisClient.on("connect", () => {
    console.log("REDIS: Connected successfully");
  });

  try {
    // Create Redis store using connect-redis v8
    sessionStore = new RedisStore({
      client: redisClient,
      prefix: "bills-session:",
    });
    console.log("SESSION: Using RedisStore for storage");
  } catch (err) {
    console.error(`SESSION: RedisStore creation failed - ${err.message}`);
    console.log("SESSION: Falling back to MemoryStore");
    sessionStore = undefined;
  }
} else {
  console.log("SESSION: Development environment using MemoryStore");
  sessionStore = undefined;
}

// Set up session middleware
app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.serializeUser((user, done) => {
  console.log(`AUTH: Serializing user ${user.id}`);
  done(null, user);
});

passport.deserializeUser((user, done) => {
  console.log(`AUTH: Deserializing user ${user.id}`);
  done(null, user);
});

// Set up Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID",
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET || "YOUR_GOOGLE_CLIENT_SECRET",
      callbackURL: callbackURL,
    },
    (accessToken, refreshToken, profile, done) => {
      console.log("AUTH: Google authentication successful");
      console.log(
        `AUTH: User profile id=${profile.id}, name=${profile.displayName}`
      );
      return done(null, profile);
    }
  )
);

// Google Auth routes
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/signin" }),
  (req, res) => {
    console.log(`AUTH: Login successful for user ${req.user.id}`);
    res.redirect("/");
  }
);

// API endpoint to get current user
app.get("/api/user", (req, res) => {
  if (req.isAuthenticated()) {
    console.log(`API: User ${req.user.id} is authenticated`);
    res.json({ user: req.user });
  } else {
    console.log("API: User not authenticated");
    res.json({ user: null });
  }
});

// Logout route
app.get("/auth/logout", (req, res, next) => {
  const userId = req.user?.id || "unknown";
  console.log(`AUTH: Logging out user ${userId}`);

  req.logout(function (err) {
    if (err) {
      console.error(`AUTH: Logout error for user ${userId} - ${err.message}`);
      return next(err);
    }
    console.log(`AUTH: User ${userId} logged out successfully`);
    res.redirect("/");
  });
});

// Serve static files
app.use(express.static(join(process.cwd())));

// Serve index.html for the root route
app.get("/", (req, res) => {
  res.sendFile(join(process.cwd(), "index.html"));
});

// Serve signin and signup pages
app.get("/signin", (req, res) => {
  res.sendFile(join(process.cwd(), "signin.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(join(process.cwd(), "signup.html"));
});

// Serve profile page
app.get("/profile", (req, res) => {
  if (req.isAuthenticated()) {
    console.log(`ROUTE: Serving profile for user ${req.user.id}`);
    res.sendFile(join(process.cwd(), "profile.html"));
  } else {
    console.log("ROUTE: Redirecting unauthenticated user to signin");
    res.redirect("/signin");
  }
});

// Fallback route - redirect all unmatched routes to index
app.get("*", (req, res) => {
  res.redirect("/");
});

// Start the server and connect to Redis if in production
const startServer = async () => {
  if (isProduction && redisClient) {
    try {
      await redisClient.connect();
      console.log("REDIS: Connection established successfully");
    } catch (err) {
      console.error(`REDIS: Connection failed - ${err.message}`);
      console.log("SESSION: Using MemoryStore as fallback");
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SERVER: Running on http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error(`SERVER: Failed to start - ${err.message}`);
});
