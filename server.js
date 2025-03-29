import express from "express";
import { join } from "path";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import connectPgSimple from "connect-pg-simple";
import { testConnection, users, bills, pgConfig } from "./db/index.js";

// Load environment variables if .env file exists
try {
  dotenv.config();
  console.log("ENV: Loaded environment variables");
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

// Database connection string
const dbUrl =
  process.env.DATABASE_URL ||
  "postgres://sushant:8JDxnvrjwCHid7g@billcreator.cb6aeu424474.eu-north-1.rds.amazonaws.com:5432/bc";
console.log(
  `DB: Connection string ${dbUrl ? "is set" : "is NOT set"} (${
    dbUrl ? dbUrl.substring(0, 20) + "..." : "undefined"
  })`
);

// Configure session store
let sessionStore;
try {
  // Create PostgreSQL session store
  const PgStore = connectPgSimple(session);
  sessionStore = new PgStore({
    conObject: pgConfig,
    tableName: "session",
    createTableIfMissing: true,
    pruneSessionInterval: 60, // Prune expired sessions every minute
  });
  console.log("SESSION: Using PostgreSQL for session storage");
} catch (err) {
  console.error(`SESSION: PostgreSQL store creation failed - ${err.message}`);
  console.log("SESSION: Falling back to MemoryStore");
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
      sameSite: "lax", // Helps with cross-site request issues
    },
    name: "bills.session", // Custom session name
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.serializeUser((user, done) => {
  console.log(`AUTH: Serializing user ${user.id}`);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  console.log(`AUTH: Deserializing user ${id}`);
  try {
    const user = await users.findById(id);
    done(null, user);
  } catch (err) {
    console.error(`AUTH: Error deserializing user - ${err.message}`);
    done(err, null);
  }
});

// Set up Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID",
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET || "YOUR_GOOGLE_CLIENT_SECRET",
      callbackURL: callbackURL,
      proxy: true, // Add proxy support for production environments behind proxies
      // Add additional options to handle SSL/TLS issues
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
      passReqToCallback: true, // Pass request object to callback
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        console.log("AUTH: Google authentication strategy executing");
        if (!profile || !profile.id) {
          console.error("AUTH: Invalid profile received from Google");
          return done(new Error("Invalid profile received from Google"), null);
        }

        console.log("AUTH: Google authentication successful");
        console.log(
          `AUTH: User profile id=${profile.id}, name=${
            profile.displayName || "unknown"
          }`
        );

        // Find or create user in database
        const user = await users.findOrCreate(profile);
        return done(null, user);
      } catch (err) {
        console.error(`AUTH: Error in Google strategy - ${err.message}`);
        return done(err, null);
      }
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
  (req, res, next) => {
    console.log("AUTH: Google callback received");
    passport.authenticate("google", { failureRedirect: "/signin" })(
      req,
      res,
      next
    );
  },
  (req, res) => {
    try {
      console.log(
        `AUTH: Login successful for user ${req.user?.id || "unknown"}`
      );
      res.redirect("/");
    } catch (err) {
      console.error(`AUTH: Error in callback handler - ${err.message}`);
      res.redirect("/signin?error=callback_error");
    }
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

// User profile API endpoints
app.get("/api/profile", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  res.json({ profile: req.user });
});

app.put("/api/profile", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const updatedUser = await users.updateProfile(req.user.id, req.body);
    res.json({ profile: updatedUser });
  } catch (err) {
    console.error(`API: Profile update error - ${err.message}`);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Bill management API endpoints
app.post("/api/bills", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const bill = await bills.create(req.user.id, req.body);
    res.status(201).json({ bill });
  } catch (err) {
    console.error(`API: Bill creation error - ${err.message}`);
    res.status(500).json({ error: "Failed to create bill" });
  }
});

app.get("/api/bills", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const userBills = await bills.findByUserId(req.user.id);
    res.json({ bills: userBills });
  } catch (err) {
    console.error(`API: Bills retrieval error - ${err.message}`);
    res.status(500).json({ error: "Failed to retrieve bills" });
  }
});

app.get("/api/bills/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const bill = await bills.findById(req.params.id, req.user.id);
    if (!bill) {
      return res.status(404).json({ error: "Bill not found" });
    }
    res.json({ bill });
  } catch (err) {
    console.error(`API: Bill retrieval error - ${err.message}`);
    res.status(500).json({ error: "Failed to retrieve bill" });
  }
});

app.put("/api/bills/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const bill = await bills.update(req.params.id, req.user.id, req.body);
    if (!bill) {
      return res.status(404).json({ error: "Bill not found" });
    }
    res.json({ bill });
  } catch (err) {
    console.error(`API: Bill update error - ${err.message}`);
    res.status(500).json({ error: "Failed to update bill" });
  }
});

app.delete("/api/bills/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const success = await bills.delete(req.params.id, req.user.id);
    if (!success) {
      return res.status(404).json({ error: "Bill not found" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(`API: Bill deletion error - ${err.message}`);
    res.status(500).json({ error: "Failed to delete bill" });
  }
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

// Start the server
const startServer = async () => {
  try {
    // Test database connection
    console.log("DB: Testing PostgreSQL connection...");
    const connected = await testConnection();

    if (!connected) {
      console.error("DB: PostgreSQL connection test failed");
      console.log("SESSION: Using MemoryStore as fallback");
    } else {
      console.log("DB: PostgreSQL connection test successful");
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`SERVER: Running on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error(`SERVER: Failed to start - ${err.message}`);
    if (err.stack) {
      console.error("SERVER: Error stack trace:");
      console.error(err.stack.split("\n").slice(0, 3).join("\n"));
    }
  }
};

startServer().catch((err) => {
  console.error(`SERVER: Failed to start - ${err.message}`);
  if (err.stack) {
    console.error("SERVER: Error stack trace:");
    console.error(err.stack.split("\n").slice(0, 3).join("\n"));
  }
});
