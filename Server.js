import express from 'express';
import cors from 'cors';
import 'dotenv/config'; // To load environment variables (like PORT, MONGO_URL)
import connectDB from './config/mongodb.js';


import trendrouter from './router/trendingRouter.js';
import loginrouter from './controller/logincontroller.js'; // Your JWT login controller


const app = express();
const port = process.env.PORT || 4000;

// -------------------- 1. DATABASE CONNECTION --------------------
connectDB();

// -------------------- 2. GLOBAL MIDDLEWARE --------------------

// Configure CORS
app.use(
  cors({
    // IMPORTANT: Whitelist your frontend origins
    origin: ['http://localhost:5173', 'https://ceejeey.me', 'http://localhost:5237'],
    // Keeping credentials: true is okay, but less critical since you moved to JWT (no session cookies)
    credentials: true, 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Expanded methods
    // NOTE: Removed 'X-CSRF-Token' from allowedHeaders as it's no longer needed
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parsers for handling JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug logger
app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.path);
  // No need to log Session ID anymore
  next();
});

// -------------------- 3. JWT AUTHENTICATION MIDDLEWARE --------------------

// NOTE: You will need a middleware function here (e.g., checkAuth) 
// to verify the JWT on protected routes. For now, we only include the router.

// -------------------- 4. ROUTES --------------------

// Login/Admin route (No protection needed here as it *creates* the token)
app.use('/api/admin', loginrouter);

// Protected API routes (You'll add the JWT verification middleware to these later)

app.use('/api/trending', trendrouter);

// -------------------- 5. ROOT & SERVER START --------------------

app.get('/', (req, res) => res.send('API working.'));

app.listen(port, () => 
  console.log(`Server starting on port ${port} in ${process.env.NODE_ENV || 'development'} mode.`)
);