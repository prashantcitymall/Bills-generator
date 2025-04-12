import express from "express";
import { join } from "path";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import connectPgSimple from "connect-pg-simple";
import { testConnection, users, bills, pgConfig, db } from "./db/index.js";
import sessionManager from "./db/session-manager.js";

// Load environment variables if .env file exists
try {
  dotenv.config();
  console.log("ENV: Loaded environment variables");
} catch (err) {
  console.log("ENV: Failed to load .env file, using defaults");
}

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy - required for secure cookies behind proxies
// For Nginx behind Route53, we need to trust all proxies in the chain
app.set("trust proxy", "loopback, linklocal, uniquelocal");

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
console.log(
  `CONFIG: Environment=${process.env.NODE_ENV}, Production=${isProduction}`
);

// Set the callback URL based on environment
const callbackURL = isProduction
  ? "https://billcreator.store/auth/google/callback"
  : `${process.env.NGROK_HOSTNAME}/auth/google/callback`;

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
  // Create PostgreSQL session store with better error handling
  const PgStore = connectPgSimple(session);
  sessionStore = new PgStore({
    conObject: pgConfig,
    tableName: "session",
    createTableIfMissing: true,
    pruneSessionInterval: 60, // Prune expired sessions every minute
    errorLog: (error) => {
      console.error(`SESSION STORE ERROR: ${error.message}`);
      if (error.stack) {
        console.error(error.stack.split("\n").slice(0, 3).join("\n"));
      }
    },
  });

  // Verify connection to session store
  sessionStore.on("connect", () => {
    console.log("SESSION: Successfully connected to PostgreSQL session store");
  });

  sessionStore.on("disconnect", () => {
    console.error("SESSION: Disconnected from PostgreSQL session store");
  });

  sessionStore.on("error", (error) => {
    console.error(`SESSION: Store error - ${error.message}`);
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
  const logger = {
    debug: (message) => {
      // Only log for main page requests, not assets
      if (
        req.originalUrl === "/" ||
        req.originalUrl.startsWith("/auth/") ||
        req.originalUrl.startsWith("/api/")
      ) {
        console.log(`PROXY-DEBUG: ${message}`);
      }
    },
  };

  // Log headers to help with debugging - only for main routes
  if (
    req.originalUrl === "/" ||
    req.originalUrl.startsWith("/auth/") ||
    req.originalUrl.startsWith("/api/")
  ) {
    logger.debug(`Protocol: ${req.protocol}, Original URL: ${req.originalUrl}`);
    logger.debug(
      `X-Forwarded-Proto: ${req.get("X-Forwarded-Proto") || "not set"}`
    );
    logger.debug(
      `X-Forwarded-Host: ${req.get("X-Forwarded-Host") || "not set"}`
    );
  }

  // Force HTTPS redirect if accessed via HTTP in production
  if (isProduction && req.headers["x-forwarded-proto"] !== "https") {
    logger.debug("Redirecting HTTP to HTTPS");
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }

  next();
});

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Debug middleware to log session information
app.use((req, res, next) => {
  const logger = {
    info: (message) => console.log(`SESSION-DEBUG: ${message}`),
    debug: (message) => {
      // Only log for main routes, not for assets
      if (
        req.originalUrl === "/" ||
        req.originalUrl.startsWith("/auth/") ||
        req.originalUrl.startsWith("/api/")
      ) {
        console.log(`SESSION-DEBUG: ${message}`);
      }
    },
  };

  // Log session ID and authentication status only for main routes
  if (
    req.sessionID &&
    (req.originalUrl === "/" ||
      req.originalUrl.startsWith("/auth/") ||
      req.originalUrl.startsWith("/api/"))
  ) {
    logger.debug(`Request has sessionID: ${req.sessionID}`);
    logger.debug(`Is authenticated: ${req.isAuthenticated()}`);

    // Check if session exists in store
    if (req.session) {
      logger.debug(
        `Session exists with cookie: ${JSON.stringify(req.session.cookie)}`
      );

      // Log passport data if it exists
      if (req.session.passport) {
        logger.debug(
          `Session has passport data: ${JSON.stringify(req.session.passport)}`
        );
      } else {
        logger.debug("Session has no passport data");
      }
    } else {
      logger.debug("Session object does not exist");
    }
  } else if (
    req.originalUrl === "/" ||
    req.originalUrl.startsWith("/auth/") ||
    req.originalUrl.startsWith("/api/")
  ) {
    logger.debug("No sessionID in request");
  }

  next();
});

// Passport configuration
passport.serializeUser((user, done) => {
  console.log(`AUTH: Serializing user ${user.id}`);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log(`AUTH: Deserializing user ${id}`);
    const user = await users.findById(id);
    if (!user) {
      console.error(`AUTH: Failed to deserialize user ${id} - not found`);
      return done(null, false);
    }
    done(null, user);
  } catch (err) {
    console.error(`AUTH: Error deserializing user - ${err.message}`);
    if (err.stack) {
      console.error(err.stack.split("\n").slice(0, 3).join("\n"));
    }
    done(err, null);
  }
});

// Set up Google Strategy
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
    // Log request headers for debugging
    const logger = {
      debug: (message) => console.log(`AUTH-DEBUG: ${message}`),
    };
    logger.debug(`Callback headers: ${JSON.stringify(req.headers["host"])}`);
    logger.debug(`Callback protocol: ${req.protocol}`);

    passport.authenticate("google", {
      failureRedirect: "/signin",
      failWithError: true,
      keepSessionInfo: true, // Keep session information across the authentication
    })(req, res, next);
  },
  async (req, res) => {
    try {
      // Check if user already has an active session
      const userId = req.user?.id;
      if (!userId) {
        console.error("AUTH: No user ID in authenticated request");
        return res.redirect("/signin?error=no_user");
      }

      console.log(`AUTH: Processing login for user ${userId}`);
      const existingSession = await sessionManager.findActiveSessionForUser(
        userId
      );
      if (existingSession) {
        console.log(
          `AUTH: User ${userId} already has active session ${existingSession.sid}, reusing`
        );
      }

      // Save the session explicitly with proper error handling
      req.session.save((err) => {
        if (err) {
          console.error(`SESSION: Error saving session - ${err.message}`);
          if (err.stack) {
            console.error(err.stack.split("\n").slice(0, 3).join("\n"));
          }
          return res.redirect("/signin?error=session_error");
        }

        console.log(
          `AUTH: Login successful for user ${userId}, session: ${req.sessionID}`
        );

        // Set a custom header to help with debugging
        res.setHeader("X-Session-ID", req.sessionID);

        // Set a session cookie manually as a backup
        res.cookie("sessionBackup", req.sessionID, {
          httpOnly: true,
          secure: isProduction,
          maxAge: 24 * 60 * 60 * 1000,
          sameSite: isProduction ? "none" : "lax",
          path: "/",
          domain: isProduction ? ".billcreator.store" : undefined,
        });

        res.redirect("/");
      });
    } catch (err) {
      console.error(`AUTH: Error in callback handler - ${err.message}`);
      if (err.stack) {
        console.error(err.stack.split("\n").slice(0, 3).join("\n"));
      }
      res.redirect("/signin?error=callback_error");
    }
  }
);

// API endpoint to get current user
app.get("/api/user", (req, res) => {
  // Create logger for this endpoint
  const logger = {
    info: (message) => console.log(`API: ${message}`),
    debug: (message) => console.log(`API-DEBUG: ${message}`),
    error: (message) => console.error(`API-ERROR: ${message}`),
  };

  if (req.isAuthenticated()) {
    logger.info(`User ${req.user.id} is authenticated`);
    logger.debug(`User data: ${JSON.stringify(req.user)}`);

    // Set cache control headers to prevent caching
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store",
    });

    // Return user data
    res.json({ user: req.user });
  } else {
    logger.info("User not authenticated");

    // Set cache control headers to prevent caching
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store",
    });

    res.json({ user: null });
  }
});

// API endpoint to check session status
app.get("/api/session/status", async (req, res) => {
  try {
    if (!req.sessionID) {
      return res.json({ active: false, message: "No session ID found" });
    }

    // Get session info from database
    const sessionInfo = await sessionManager.getSessionInfo(req.sessionID);

    if (!sessionInfo) {
      return res.json({ active: false, message: "Session not found" });
    }

    // Check if session is active and not expired
    const isActive =
      sessionInfo.status === "active" &&
      new Date(sessionInfo.expire) > new Date();

    res.json({
      active: isActive,
      status: sessionInfo.status,
      expires: sessionInfo.expire,
      message: isActive
        ? "Session is active"
        : "Session is inactive or expired",
    });
  } catch (err) {
    console.error(`API: Error checking session status - ${err.message}`);
    if (err.stack) {
      console.error(err.stack.split("\n").slice(0, 3).join("\n"));
    }
    res.status(500).json({ error: "Error checking session status" });
  }
});

// Logout route
app.get("/auth/logout", async (req, res) => {
  try {
    const userId = req.user?.id || "unknown";
    console.log(`AUTH: Logging out user ${userId}`);

    // Mark all user sessions as logged out in the database
    if (userId && userId !== "unknown") {
      await sessionManager.logoutAllUserSessions(userId);
    }

    // Mark current session as logged out if we have a session ID
    if (req.sessionID) {
      await sessionManager.updateSessionStatus(req.sessionID, "logged_out");
    }

    // Destroy the session
    req.logout(function (err) {
      if (err) {
        console.error(`AUTH: Error during logout - ${err.message}`);
        return res.status(500).json({ error: "Failed to logout" });
      }

      req.session.destroy(function (err) {
        if (err) {
          console.error(`SESSION: Error destroying session - ${err.message}`);
        }

        // Clear the session cookie
        res.clearCookie("bills.session", {
          path: "/",
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? "none" : "lax",
        });

        console.log("AUTH: User logged out successfully");
        res.redirect("/");
      });
    });
  } catch (err) {
    console.error(`AUTH: Error in logout handler - ${err.message}`);
    if (err.stack) {
      console.error(err.stack.split("\n").slice(0, 3).join("\n"));
    }
    res.status(500).json({ error: "Internal server error during logout" });
  }
});

// API endpoint to get user profile data
app.get("/api/profile", (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      console.log("API: Unauthenticated request to /api/profile");
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = req.user.id;
    console.log(`API: Fetching profile data for user ${userId}`);

    // Query the database for user profile
    db.oneOrNone("SELECT * FROM users WHERE id = $1", [userId])
      .then((user) => {
        if (!user) {
          console.error(`API: User ${userId} not found in database`);
          return res.status(404).json({ error: "User not found" });
        }

        // Return user profile data
        res.json({
          profile: {
            id: user.id,
            email: user.email,
            display_name: user.display_name,
            profile_picture: user.profile_picture,
            created_at: user.created_at,
          },
        });
      })
      .catch((err) => {
        console.error(`DATABASE: Error fetching user profile - ${err.message}`);
        if (err.stack) {
          console.error(err.stack.split("\n").slice(0, 3).join("\n"));
        }
        res.status(500).json({ error: "Database error" });
      });
  } catch (err) {
    console.error(`API: Unexpected error in /api/profile - ${err.message}`);
    if (err.stack) {
      console.error(err.stack.split("\n").slice(0, 3).join("\n"));
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// API endpoint to get user's bills
app.get("/api/bills", (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      console.log("API: Unauthenticated request to /api/bills");
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = req.user.id;
    console.log(`API: Fetching bills for user ${userId}`);

    // Query the database for user's bills
    db.any("SELECT * FROM bills WHERE user_id = $1 ORDER BY created_at DESC", [
      userId,
    ])
      .then((bills) => {
        res.json({ bills });
      })
      .catch((err) => {
        console.error(`DATABASE: Error fetching user bills - ${err.message}`);
        if (err.stack) {
          console.error(err.stack.split("\n").slice(0, 3).join("\n"));
        }
        res.status(500).json({ error: "Database error" });
      });
  } catch (err) {
    console.error(`API: Unexpected error in /api/bills - ${err.message}`);
    if (err.stack) {
      console.error(err.stack.split("\n").slice(0, 3).join("\n"));
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// API endpoint to get a specific bill
app.get("/api/bills/:id", (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      console.log("API: Unauthenticated request to /api/bills/:id");
      return res.status(401).json({ error: "Not authenticated" });
    }

    const billId = req.params.id;
    const userId = req.user.id;
    console.log(`API: Fetching bill ${billId} for user ${userId}`);

    // Query the database for the bill
    db.oneOrNone("SELECT * FROM bills WHERE id = $1 AND user_id = $2", [
      billId,
      userId,
    ])
      .then((bill) => {
        if (!bill) {
          console.error(`API: Bill ${billId} not found for user ${userId}`);
          return res.status(404).json({ error: "Bill not found" });
        }

        // Return the bill
        res.json({ bill });
      })
      .catch((err) => {
        console.error(`DATABASE: Error fetching bill - ${err.message}`);
        if (err.stack) {
          console.error(err.stack.split("\n").slice(0, 3).join("\n"));
        }
        res.status(500).json({ error: "Database error" });
      });
  } catch (err) {
    console.error(`API: Unexpected error in /api/bills/:id - ${err.message}`);
    if (err.stack) {
      console.error(err.stack.split("\n").slice(0, 3).join("\n"));
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// API endpoint to create a new bill
app.post("/api/bills", (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      console.log("API: Unauthenticated request to /api/bills");
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = req.user.id;
    console.log(`API: Creating new bill for user ${userId}`);

    // Create a new bill
    db.none(
      "INSERT INTO bills (user_id, name, amount, due_date) VALUES ($1, $2, $3, $4)",
      [userId, req.body.name, req.body.amount, req.body.due_date]
    )
      .then(() => {
        console.log(`API: Bill created successfully for user ${userId}`);
        res.status(201).json({ message: "Bill created successfully" });
      })
      .catch((err) => {
        console.error(`DATABASE: Error creating bill - ${err.message}`);
        if (err.stack) {
          console.error(err.stack.split("\n").slice(0, 3).join("\n"));
        }
        res.status(500).json({ error: "Database error" });
      });
  } catch (err) {
    console.error(`API: Unexpected error in /api/bills - ${err.message}`);
    if (err.stack) {
      console.error(err.stack.split("\n").slice(0, 3).join("\n"));
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// API endpoint to update a bill
app.put("/api/bills/:id", (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      console.log("API: Unauthenticated request to /api/bills/:id");
      return res.status(401).json({ error: "Not authenticated" });
    }

    const billId = req.params.id;
    const userId = req.user.id;
    console.log(`API: Updating bill ${billId} for user ${userId}`);

    // Update the bill
    db.none(
      "UPDATE bills SET name = $1, amount = $2, due_date = $3 WHERE id = $4 AND user_id = $5",
      [req.body.name, req.body.amount, req.body.due_date, billId, userId]
    )
      .then(() => {
        console.log(
          `API: Bill ${billId} updated successfully for user ${userId}`
        );
        res.json({ message: "Bill updated successfully" });
      })
      .catch((err) => {
        console.error(`DATABASE: Error updating bill - ${err.message}`);
        if (err.stack) {
          console.error(err.stack.split("\n").slice(0, 3).join("\n"));
        }
        res.status(500).json({ error: "Database error" });
      });
  } catch (err) {
    console.error(`API: Unexpected error in /api/bills/:id - ${err.message}`);
    if (err.stack) {
      console.error(err.stack.split("\n").slice(0, 3).join("\n"));
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// API endpoint to delete a bill
app.delete("/api/bills/:id", (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      console.log("API: Unauthenticated request to /api/bills/:id");
      return res.status(401).json({ error: "Not authenticated" });
    }

    const billId = req.params.id;
    const userId = req.user.id;
    console.log(`API: Deleting bill ${billId} for user ${userId}`);

    // Delete the bill
    db.none("DELETE FROM bills WHERE id = $1 AND user_id = $2", [
      billId,
      userId,
    ])
      .then(() => {
        console.log(
          `API: Bill ${billId} deleted successfully for user ${userId}`
        );
        res.json({ message: "Bill deleted successfully" });
      })
      .catch((err) => {
        console.error(`DATABASE: Error deleting bill - ${err.message}`);
        if (err.stack) {
          console.error(err.stack.split("\n").slice(0, 3).join("\n"));
        }
        res.status(500).json({ error: "Database error" });
      });
  } catch (err) {
    console.error(`API: Unexpected error in /api/bills/:id - ${err.message}`);
    if (err.stack) {
      console.error(err.stack.split("\n").slice(0, 3).join("\n"));
    }
    res.status(500).json({ error: "Internal server error" });
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
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      console.log(
        "AUTH: Unauthenticated user attempted to access profile page"
      );
      return res.redirect("/signin.html");
    }

    console.log(
      `AUTH: Serving profile page for user ${req.user?.id || "unknown"}`
    );
    res.sendFile(join(process.cwd(), "profile.html"));
  } catch (err) {
    console.error(`SERVER: Error serving profile page - ${err.message}`);
    if (err.stack) {
      console.error(err.stack.split("\n").slice(0, 3).join("\n"));
    }
    res.status(500).send("Internal server error");
  }
});

// Fallback route - redirect all unmatched routes to index
app.get("*", (req, res) => {
  res.redirect("/");
});

// Start the server
async function startServer() {
  try {
    console.log("SERVER: Testing database connection...");
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error("Database connection failed");
    }

    // Clean up expired sessions on server start
    const cleanedSessions = await sessionManager.cleanupExpiredSessions();
    console.log(`SERVER: Cleaned up ${cleanedSessions} expired sessions`);

    // Schedule periodic session cleanup
    setInterval(async () => {
      const cleanedSessions = await sessionManager.cleanupExpiredSessions();
      if (cleanedSessions > 0) {
        console.log(`SERVER: Cleaned up ${cleanedSessions} expired sessions`);
      }
    }, 60 * 60 * 1000); // Run every hour

    // Start the server
    const HOST =
      process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
    app.listen(PORT, HOST, () => {
      console.log(`SERVER: Running on http://${HOST}:${PORT}`);
    });
  } catch (err) {
    console.error(`SERVER: Failed to start - ${err.message}`);
    if (err.stack) {
      console.error("SERVER: Error stack trace:");
      console.error(err.stack.split("\n").slice(0, 5).join("\n"));
    }
    process.exit(1);
  }
}

startServer().catch((err) => {
  console.error(`SERVER: Failed to start - ${err.message}`);
  if (err.stack) {
    console.error("SERVER: Error stack trace:");
    console.error(err.stack.split("\n").slice(0, 5).join("\n"));
  }
  process.exit(1);
});
