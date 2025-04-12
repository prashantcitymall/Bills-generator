import express from "express";
import { join } from "path";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import connectPgSimple from "connect-pg-simple";
import { users, bills, pgConfig } from "./db/index.js";
import { createLogger } from "./utils/logger.js";
import { errorHandler } from "./middleware/error-handler.js";

// Initialize logger
const logger = createLogger("app");

// Load environment variables if .env file exists
try {
  dotenv.config();
  logger.info("Loaded environment variables");
} catch (err) {
  logger.warn("Failed to load .env file, using defaults", {
    error: err.message,
  });
}

const app = express();

// Trust proxy - required for secure cookies behind API Gateway
app.set("trust proxy", true);

// Enable CORS with credentials support
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://billcreator.store", "https://www.billcreator.store"]
        : ["http://localhost:3001", process.env.NGROK_HOSTNAME],
    credentials: true, // Allow cookies to be sent with requests
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["X-Session-ID"], // Expose custom headers
  })
);

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Check if we're in production mode
const isProduction = process.env.NODE_ENV === "production";
logger.info("Application configuration", {
  environment: process.env.NODE_ENV,
  production: isProduction,
});

// Set the callback URL based on environment
const callbackURL = isProduction
  ? "https://billcreator.store/auth/google/callback"
  : `${process.env.NGROK_HOSTNAME}/auth/google/callback`;

logger.info("Authentication configuration", { callbackURL });

// Database connection string
const dbUrl =
  process.env.DATABASE_URL ||
  "postgres://sushant:8JDxnvrjwCHid7g@billcreator.cb6aeu424474.eu-north-1.rds.amazonaws.com:5432/bc";
logger.info("Database configuration", { connectionStringSet: !!dbUrl });

// Configure session store
let sessionStore;
try {
  // Create PostgreSQL session store with better error handling
  const PgStore = connectPgSimple(session);
  sessionStore = new PgStore({
    conObject: pgConfig,
    tableName: "session",
    createTableIfMissing: true,
    pruneSessionInterval: 60, // Prune expired sessions every minute
    errorLog: (error) => {
      logger.error("PostgreSQL session store error", {
        error: error.message,
        stack: error.stack,
      });
    },
  });

  // Verify connection to session store
  sessionStore.on("connect", () => {
    logger.info("Successfully connected to PostgreSQL session store");
  });

  sessionStore.on("disconnect", () => {
    logger.error("Disconnected from PostgreSQL session store");
  });

  sessionStore.on("error", (error) => {
    logger.error("Session store error", { error: error.message });
  });

  logger.info("Session configuration", { store: "PostgreSQL" });
} catch (err) {
  logger.error("PostgreSQL store creation failed", {
    error: err.message,
    stack: err.stack,
  });
  logger.warn("Falling back to MemoryStore", {
    note: "Not recommended for production",
  });
  sessionStore = undefined;
}

// Set up session middleware
app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: false,
    proxy: true, // Trust the reverse proxy
    cookie: {
      secure: isProduction, // Only use secure cookies in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: isProduction ? "none" : "lax", // Use 'none' in production for cross-site requests
      path: "/",
      domain: isProduction ? ".billcreator.store" : undefined, // Use domain in production
    },
    name: "bills.session", // Custom session name
  })
);

// Add middleware to ensure X-Forwarded-Proto is properly handled
app.use((req, res, next) => {
  const reqLogger = logger.addContext({ path: req.path, method: req.method });

  // Log headers to help with debugging - only for main routes
  if (
    req.originalUrl === "/" ||
    req.originalUrl.startsWith("/auth/") ||
    req.originalUrl.startsWith("/api/")
  ) {
    reqLogger.debug("Request headers", {
      protocol: req.protocol,
      originalUrl: req.originalUrl,
      forwardedProto: req.get("X-Forwarded-Proto"),
      forwardedHost: req.get("X-Forwarded-Host"),
    });
  }

  // Force HTTPS redirect if accessed via HTTP in production
  if (isProduction && req.headers["x-forwarded-proto"] !== "https") {
    reqLogger.info("Redirecting HTTP to HTTPS");
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }

  next();
});

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Debug middleware to log session information
app.use((req, res, next) => {
  const reqLogger = logger.addContext({ path: req.path, method: req.method });

  // Log session ID and authentication status only for main routes
  if (
    req.sessionID &&
    (req.originalUrl === "/" ||
      req.originalUrl.startsWith("/auth/") ||
      req.originalUrl.startsWith("/api/"))
  ) {
    reqLogger.debug("Session information", {
      sessionId: req.sessionID,
      authenticated: req.isAuthenticated(),
      sessionExists: !!req.session,
      sessionData: req.session
        ? {
            hasCookie: !!req.session.cookie,
            hasPassport: !!req.session.passport,
          }
        : null,
    });
  }

  next();
});

// Configure Passport to use Google OAuth 2.0 strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: isProduction
        ? process.env.GOOGLE_CLIENT_ID
        : process.env.GOOGLE_CLIENT_ID_LOCAL,
      clientSecret: isProduction
        ? process.env.GOOGLE_CLIENT_SECRET
        : process.env.GOOGLE_CLIENT_SECRET_LOCAL,
      callbackURL: callbackURL,
      scope: ["profile", "email"],
      state: true,
      proxy: true, // Add proxy support for production environments behind proxies
      // Add additional options to handle SSL/TLS issues
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const authLogger = logger.addContext({ profileId: profile.id });
        authLogger.info("Google authentication callback");

        // Check if user exists in database
        const existingUser = await users.findByGoogleId(profile.id);

        if (existingUser) {
          authLogger.info("Existing user found", { userId: existingUser.id });
          return done(null, existingUser);
        }

        // Use findOrCreate instead of manually creating the user
        try {
          const newUser = await users.findOrCreate(profile);
          authLogger.info("Created new user", { userId: newUser.id });
          return done(null, newUser);
        } catch (error) {
          authLogger.error("Error creating user", { error });
          return done(error);
        }
      } catch (error) {
        logger.error("Error in Google strategy", { error });
        return done(error);
      }
    }
  )
);

// Serialize user to session
passport.serializeUser((user, done) => {
  logger.debug("Serializing user to session", { userId: user.id });
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const authLogger = logger.addContext({ userId: id });
    authLogger.debug("Deserializing user from session");
    const user = await users.findById(id);
    if (!user) {
      authLogger.warn("User not found during deserialization");
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    logger.error("Error deserializing user", { error, userId: id });
    done(error);
  }
});

// Serve static files
app.use(express.static("."));

// Authentication routes
app.get("/auth/google", (req, res, next) => {
  const authLogger = logger.addContext({ path: req.path });
  authLogger.info("Google auth route accessed", {
    host: req.headers.host,
    protocol: req.protocol,
  });

  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })(req, res, next);
});

app.get("/auth/google/callback", (req, res, next) => {
  const authLogger = logger.addContext({ path: req.path });
  authLogger.info("Google auth callback route accessed", {
    host: req.headers.host,
    protocol: req.protocol,
  });

  passport.authenticate("google", {
    successRedirect: "/",
    failureRedirect: "/signin.html",
  })(req, res, next);
});

app.get("/auth/logout", (req, res) => {
  const authLogger = logger.addContext({ path: req.path });

  if (req.isAuthenticated()) {
    authLogger.info("Logging out authenticated user", { userId: req.user.id });

    req.logout(function (err) {
      if (err) {
        authLogger.error("Logout error", { error: err.message });
        return res.status(500).json({ error: "Logout failed" });
      }
      authLogger.info("User logged out successfully");
      res.redirect("/");
    });
  } else {
    authLogger.info("No authenticated user to logout");
    res.redirect("/");
  }
});

// User info route
app.get("/api/user", (req, res) => {
  const apiLogger = logger.addContext({ path: req.path });

  if (req.isAuthenticated()) {
    apiLogger.info("Authenticated user info request", { userId: req.user.id });
    res.json({ user: req.user });
  } else {
    apiLogger.info("Unauthenticated user info request");
    res.json({ user: null });
  }
});

// Bills API routes
app.get("/api/bills", (req, res) => {
  try {
    const apiLogger = logger.addContext({ path: req.path });

    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      apiLogger.warn("Unauthenticated request");
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get user ID from session
    const userId = req.user.id;
    apiLogger.info("Getting bills for user", { userId });

    // Get bills from database
    bills
      .getByUserId(userId)
      .then((userBills) => {
        apiLogger.info("Found bills for user", {
          userId,
          count: userBills.length,
        });
        res.json({ bills: userBills });
      })
      .catch((error) => {
        apiLogger.error("Error getting bills", { error, userId });
        res.status(500).json({ error: "Failed to get bills" });
      });
  } catch (error) {
    logger.error("Exception in /api/bills", { error });
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/bills", (req, res) => {
  try {
    const apiLogger = logger.addContext({ path: req.path });

    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      apiLogger.warn("Unauthenticated request");
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get user ID from session
    const userId = req.user.id;
    apiLogger.info("Creating bill for user", { userId });

    // Get bill data from request body
    const billData = req.body;
    if (!billData || !billData.type || !billData.data) {
      apiLogger.warn("Invalid bill data", { billData });
      return res.status(400).json({ error: "Invalid bill data" });
    }

    // Add user ID to bill data
    billData.user_id = userId;

    // Create bill in database
    bills
      .create(billData)
      .then((newBill) => {
        apiLogger.info("Created bill for user", { billId: newBill.id, userId });
        res.status(201).json({ bill: newBill });
      })
      .catch((error) => {
        apiLogger.error("Error creating bill", { error, userId });
        res.status(500).json({ error: "Failed to create bill" });
      });
  } catch (error) {
    logger.error("Exception in POST /api/bills", { error });
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/bills/:id", (req, res) => {
  try {
    const billId = req.params.id;
    const apiLogger = logger.addContext({ path: req.path, billId });

    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      apiLogger.warn("Unauthenticated request");
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get user ID from session
    const userId = req.user.id;
    apiLogger.info("Updating bill for user", { userId, billId });

    // Get bill data from request body
    const billData = req.body;
    if (!billData || !billData.type || !billData.data) {
      apiLogger.warn("Invalid bill data", { billData });
      return res.status(400).json({ error: "Invalid bill data" });
    }

    // Check if bill exists and belongs to user
    bills
      .getById(billId)
      .then((existingBill) => {
        if (!existingBill) {
          apiLogger.warn("Bill not found", { billId });
          return res.status(404).json({ error: "Bill not found" });
        }

        if (existingBill.user_id !== userId) {
          apiLogger.warn("Unauthorized bill access", {
            billId,
            billOwnerId: existingBill.user_id,
            requestUserId: userId,
          });
          return res.status(403).json({ error: "Not authorized" });
        }

        // Update bill in database
        return bills.update(billId, billData).then((updatedBill) => {
          apiLogger.info("Updated bill for user", { billId, userId });
          res.json({ bill: updatedBill });
        });
      })
      .catch((error) => {
        apiLogger.error("Error updating bill", { error, billId, userId });
        res.status(500).json({ error: "Failed to update bill" });
      });
  } catch (error) {
    logger.error("Exception in PUT /api/bills/:id", {
      error,
      billId: req.params.id,
    });
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/bills/:id", (req, res) => {
  try {
    const billId = req.params.id;
    const apiLogger = logger.addContext({ path: req.path, billId });

    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      apiLogger.warn("Unauthenticated request");
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get user ID from session
    const userId = req.user.id;
    apiLogger.info("Deleting bill for user", { userId, billId });

    // Check if bill exists and belongs to user
    bills
      .getById(billId)
      .then((existingBill) => {
        if (!existingBill) {
          apiLogger.warn("Bill not found", { billId });
          return res.status(404).json({ error: "Bill not found" });
        }

        if (existingBill.user_id !== userId) {
          apiLogger.warn("Unauthorized bill access", {
            billId,
            billOwnerId: existingBill.user_id,
            requestUserId: userId,
          });
          return res.status(403).json({ error: "Not authorized" });
        }

        // Delete bill from database
        return bills.delete(billId).then(() => {
          apiLogger.info("Deleted bill for user", { billId, userId });
          res.status(204).send();
        });
      })
      .catch((error) => {
        apiLogger.error("Error deleting bill", { error, billId, userId });
        res.status(500).json({ error: "Failed to delete bill" });
      });
  } catch (error) {
    logger.error("Exception in DELETE /api/bills/:id", {
      error,
      billId: req.params.id,
    });
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  logger.info("Health check request");
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Add error handler middleware
app.use(errorHandler());

// Catch-all route for SPA
app.get("*", (req, res) => {
  // Exclude API routes and static files
  if (
    req.path.startsWith("/api/") ||
    req.path.endsWith(".js") ||
    req.path.endsWith(".css") ||
    req.path.endsWith(".html") ||
    req.path.endsWith(".svg") ||
    req.path.endsWith(".png") ||
    req.path.endsWith(".jpg") ||
    req.path.endsWith(".ico")
  ) {
    return res.status(404).json({ error: "Not found" });
  }

  // Serve index.html for all other routes
  res.sendFile(join(process.cwd(), "index.html"));
});

export default app;
