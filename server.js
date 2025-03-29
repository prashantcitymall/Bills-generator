import express from "express";
import { join } from "path";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import connectPgSimple from "connect-pg-simple";
import { testConnection, users, bills, pgConfig, db } from "./db/index.js";

// Load environment variables if .env file exists
try {
  dotenv.config();
  console.log("ENV: Loaded environment variables");
} catch (err) {
  console.log("ENV: Failed to load .env file, using defaults");
}

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS with credentials support
app.use(cors({
  origin: process.env.NODE_ENV === "production" ? 'https://billcreator.store' : 'http://localhost:3001',
  credentials: true, // Allow cookies to be sent with requests
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
      secure: isProduction, // Only use secure cookies in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: isProduction ? 'none' : 'lax', // Use 'none' in production for cross-site requests
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
    passport.authenticate("google", { failureRedirect: "/signin", failWithError: true })(req, res, next);
  },
  (req, res) => {
    try {
      // Ensure session is saved before redirect
      req.session.save((err) => {
        if (err) {
          console.error(`SESSION: Error saving session - ${err.message}`);
          if (err.stack) {
            console.error(err.stack.split("\n").slice(0, 3).join("\n"));
          }
          return res.redirect('/signin?error=session_error');
        }
        
        console.log(`AUTH: Login successful for user ${req.user?.id || "unknown"}`);
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
  if (req.isAuthenticated()) {
    console.log(`API: User ${req.user.id} is authenticated`);
    res.json({ user: req.user });
  } else {
    console.log("API: User not authenticated");
    res.json({ user: null });
  }
});

// Logout route
app.get('/auth/logout', (req, res) => {
  try {
    const userId = req.user?.id || 'unknown';
    console.log(`AUTH: Logging out user ${userId}`);
    
    // Destroy the session
    req.logout(function(err) {
      if (err) {
        console.error(`AUTH: Error during logout - ${err.message}`);
        return res.status(500).json({ error: 'Failed to logout' });
      }
      
      req.session.destroy(function(err) {
        if (err) {
          console.error(`SESSION: Error destroying session - ${err.message}`);
        }
        
        // Clear the session cookie
        res.clearCookie('bills.session', {
          path: '/',
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? 'none' : 'lax'
        });
        
        console.log('AUTH: User logged out successfully');
        res.redirect('/');
      });
    });
  } catch (err) {
    console.error(`AUTH: Unexpected error during logout - ${err.message}`);
    if (err.stack) {
      console.error(err.stack.split("\n").slice(0, 3).join("\n"));
    }
    res.status(500).json({ error: 'Internal server error during logout' });
  }
});

// API endpoint to get user profile data
app.get('/api/profile', (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      console.log('API: Unauthenticated request to /api/profile');
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = req.user.id;
    console.log(`API: Fetching profile data for user ${userId}`);
    
    // Query the database for user profile
    db.oneOrNone('SELECT * FROM users WHERE id = $1', [userId])
      .then(user => {
        if (!user) {
          console.error(`API: User ${userId} not found in database`);
          return res.status(404).json({ error: 'User not found' });
        }
        
        // Return user profile data
        res.json({
          profile: {
            id: user.id,
            email: user.email,
            display_name: user.display_name,
            profile_picture: user.profile_picture,
            created_at: user.created_at
          }
        });
      })
      .catch(err => {
        console.error(`DATABASE: Error fetching user profile - ${err.message}`);
        if (err.stack) {
          console.error(err.stack.split("\n").slice(0, 3).join("\n"));
        }
        res.status(500).json({ error: 'Database error' });
      });
  } catch (err) {
    console.error(`API: Unexpected error in /api/profile - ${err.message}`);
    if (err.stack) {
      console.error(err.stack.split("\n").slice(0, 3).join("\n"));
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to get user's bills
app.get('/api/bills', (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      console.log('API: Unauthenticated request to /api/bills');
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = req.user.id;
    console.log(`API: Fetching bills for user ${userId}`);
    
    // Query the database for user's bills
    db.any('SELECT * FROM bills WHERE user_id = $1 ORDER BY created_at DESC', [userId])
      .then(bills => {
        res.json({ bills });
      })
      .catch(err => {
        console.error(`DATABASE: Error fetching user bills - ${err.message}`);
        if (err.stack) {
          console.error(err.stack.split("\n").slice(0, 3).join("\n"));
        }
        res.status(500).json({ error: 'Database error' });
      });
  } catch (err) {
    console.error(`API: Unexpected error in /api/bills - ${err.message}`);
    if (err.stack) {
      console.error(err.stack.split("\n").slice(0, 3).join("\n"));
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to get a specific bill
app.get('/api/bills/:id', (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      console.log('API: Unauthenticated request to /api/bills/:id');
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const billId = req.params.id;
    const userId = req.user.id;
    console.log(`API: Fetching bill ${billId} for user ${userId}`);
    
    // Query the database for the bill
    db.oneOrNone('SELECT * FROM bills WHERE id = $1 AND user_id = $2', [billId, userId])
      .then(bill => {
        if (!bill) {
          console.error(`API: Bill ${billId} not found for user ${userId}`);
          return res.status(404).json({ error: 'Bill not found' });
        }
        
        // Return the bill
        res.json({ bill });
      })
      .catch(err => {
        console.error(`DATABASE: Error fetching bill - ${err.message}`);
        if (err.stack) {
          console.error(err.stack.split("\n").slice(0, 3).join("\n"));
        }
        res.status(500).json({ error: 'Database error' });
      });
  } catch (err) {
    console.error(`API: Unexpected error in /api/bills/:id - ${err.message}`);
    if (err.stack) {
      console.error(err.stack.split("\n").slice(0, 3).join("\n"));
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to create a new bill
app.post('/api/bills', (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      console.log('API: Unauthenticated request to /api/bills');
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = req.user.id;
    console.log(`API: Creating new bill for user ${userId}`);
    
    // Create a new bill
    db.none('INSERT INTO bills (user_id, name, amount, due_date) VALUES ($1, $2, $3, $4)', [userId, req.body.name, req.body.amount, req.body.due_date])
      .then(() => {
        console.log(`API: Bill created successfully for user ${userId}`);
        res.status(201).json({ message: 'Bill created successfully' });
      })
      .catch(err => {
        console.error(`DATABASE: Error creating bill - ${err.message}`);
        if (err.stack) {
          console.error(err.stack.split("\n").slice(0, 3).join("\n"));
        }
        res.status(500).json({ error: 'Database error' });
      });
  } catch (err) {
    console.error(`API: Unexpected error in /api/bills - ${err.message}`);
    if (err.stack) {
      console.error(err.stack.split("\n").slice(0, 3).join("\n"));
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to update a bill
app.put('/api/bills/:id', (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      console.log('API: Unauthenticated request to /api/bills/:id');
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const billId = req.params.id;
    const userId = req.user.id;
    console.log(`API: Updating bill ${billId} for user ${userId}`);
    
    // Update the bill
    db.none('UPDATE bills SET name = $1, amount = $2, due_date = $3 WHERE id = $4 AND user_id = $5', [req.body.name, req.body.amount, req.body.due_date, billId, userId])
      .then(() => {
        console.log(`API: Bill ${billId} updated successfully for user ${userId}`);
        res.json({ message: 'Bill updated successfully' });
      })
      .catch(err => {
        console.error(`DATABASE: Error updating bill - ${err.message}`);
        if (err.stack) {
          console.error(err.stack.split("\n").slice(0, 3).join("\n"));
        }
        res.status(500).json({ error: 'Database error' });
      });
  } catch (err) {
    console.error(`API: Unexpected error in /api/bills/:id - ${err.message}`);
    if (err.stack) {
      console.error(err.stack.split("\n").slice(0, 3).join("\n"));
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to delete a bill
app.delete('/api/bills/:id', (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      console.log('API: Unauthenticated request to /api/bills/:id');
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const billId = req.params.id;
    const userId = req.user.id;
    console.log(`API: Deleting bill ${billId} for user ${userId}`);
    
    // Delete the bill
    db.none('DELETE FROM bills WHERE id = $1 AND user_id = $2', [billId, userId])
      .then(() => {
        console.log(`API: Bill ${billId} deleted successfully for user ${userId}`);
        res.json({ message: 'Bill deleted successfully' });
      })
      .catch(err => {
        console.error(`DATABASE: Error deleting bill - ${err.message}`);
        if (err.stack) {
          console.error(err.stack.split("\n").slice(0, 3).join("\n"));
        }
        res.status(500).json({ error: 'Database error' });
      });
  } catch (err) {
    console.error(`API: Unexpected error in /api/bills/:id - ${err.message}`);
    if (err.stack) {
      console.error(err.stack.split("\n").slice(0, 3).join("\n"));
    }
    res.status(500).json({ error: 'Internal server error' });
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
app.get('/profile', (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      console.log('AUTH: Unauthenticated user attempted to access profile page');
      return res.redirect('/signin.html');
    }
    
    console.log(`AUTH: Serving profile page for user ${req.user?.id || 'unknown'}`);
    res.sendFile(join(process.cwd(), 'profile.html'));
  } catch (err) {
    console.error(`SERVER: Error serving profile page - ${err.message}`);
    if (err.stack) {
      console.error(err.stack.split("\n").slice(0, 3).join("\n"));
    }
    res.status(500).send('Internal server error');
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
