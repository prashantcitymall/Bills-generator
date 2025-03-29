import express from "express";
import { join } from "path";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";

// Load environment variables if .env file exists
try {
    dotenv.config();
} catch (err) {
    console.log('No .env file found, using default environment variables');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Check if we're in production mode
const isProduction = process.env.NODE_ENV === 'production';
console.log(`NODE_ENV: ${process.env.NODE_ENV}, isProduction: ${isProduction}`);

// Set the callback URL based on environment
const callbackURL = isProduction
    ? 'https://billcreator.store/auth/google/callback'
    : 'http://localhost:3001/auth/google/callback';

console.log(`Using Google OAuth callback URL: ${callbackURL}`);

// Set up session middleware
// NOTE: MemoryStore is used for development only. For production, use a persistent store like MongoDB
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: isProduction,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// Set up Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET',
    callbackURL: callbackURL
}, (accessToken, refreshToken, profile, done) => {
    // Log detailed information about the user profile
    console.log('Google authentication successful');
    console.log('User profile:', {
        id: profile.id,
        displayName: profile.displayName,
        name: profile.name,
        emails: profile.emails,
        photos: profile.photos
    });
    
    // Here you would typically save the user to your database
    // For now, we'll just pass the profile info
    return done(null, profile);
}));

// Google Auth routes
app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/signin' }),
    (req, res) => {
        // Successful authentication, redirect home.
        res.redirect('/');
    }
);

// API endpoint to get current user
app.get('/api/user', (req, res) => {
    if (req.isAuthenticated()) {
        console.log('User is authenticated, returning user data');
        res.json({ user: req.user });
    } else {
        console.log('User is not authenticated');
        res.json({ user: null });
    }
});

// Logout route
app.get('/auth/logout', (req, res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

// Serve static files
app.use(express.static(join(process.cwd())));

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(join(process.cwd(), 'index.html'));
});

// Serve signin and signup pages
app.get('/signin', (req, res) => {
    res.sendFile(join(process.cwd(), 'signin.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(join(process.cwd(), 'signup.html'));
});

// Fallback route - redirect all unmatched routes to index
app.get('*', (req, res) => {
    res.redirect('/');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
