import express from 'express';
import cors from 'cors';
<<<<<<< HEAD
import 'dotenv/config';
import router from './router/PackageRoute.js';
import connectDB from './config/mongodb.js';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import csrf from 'csurf';
import includerouter from './router/includeRouter.js';
import trendrouter from './router/trendingRouter.js';
import loginrouter from './controller/logincontroller.js';
import gallryRouter from './router/GalleryRouter.js';
import paymentRoutes from './router/PaymentRouter.js';
import afterPaymenRoutes from './router/afterPaymentRouter.js';
=======
import 'dotenv/config'; // To load environment variables (like PORT, MONGO_URL)
import connectDB from './config/mongodb.js';


import trendrouter from './router/trendingRouter.js';
import loginrouter from './controller/logincontroller.js'; // Your JWT login controller

>>>>>>> 515b6ca (Initial commit)

const app = express();
const port = process.env.PORT || 4000;

<<<<<<< HEAD
// -------------------- CONNECT DB --------------------
connectDB();

const mongoUri = process.env.MONGO_URL;
const sessionStore = MongoStore.create({
  mongoUrl: mongoUri,
  collectionName: 'sessions',
});
sessionStore.on('error', (error) => console.error('MongoStore error:', error));
sessionStore.on('connected', () => console.log('MongoStore connected to MongoDB'));

// -------------------- GLOBAL MIDDLEWARE --------------------
app.use(
  cors({
    origin: ['http://localhost:5173', 'https://ceejeey.me'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------- PAYMENT APP --------------------
const paymentApp = express();

// Session first
paymentApp.use(
  session({
    name: 'session',
    secret: process.env.SESSION_SECRET || 'your-secret',
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: {
      domain: process.env.NODE_ENV === 'production' ? 'ceejeey.me' : undefined,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      httpOnly: true,
      path: '/',
    },
  })
);

// Debug logger
paymentApp.use((req, res, next) => {
  console.log(
    'Incoming request:',
    req.path,
    'Cookies:',
    req.headers.cookie,
    'Session ID:',
    req.sessionID
  );
  next();
});

// -------------------- CONDITIONAL CSRF --------------------
const csrfProtection = csrf({ cookie: false });

paymentApp.use((req, res, next) => {
  // ✅ Skip CSRF for PayHere notify + cleanup endpoints
  if (
    req.path === '/notify/payhere' ||
    req.path === '/clear-order' ||
    req.path === '/logout'
  ) {
    return next();
  }
  return csrfProtection(req, res, next);
});

// Ensure CSRF token in session (only when csrfProtection ran)
paymentApp.use((req, res, next) => {
  if (!req.session) {
    console.error('No session found for request:', req.path);
    return res.status(500).json({ error: 'Session not initialized' });
  }

  // If csrfProtection didn't run, req.csrfToken won't exist → skip
  if (typeof req.csrfToken !== 'function') {
    return next();
  }

  if (!req.session.csrfToken) {
    req.session.csrfToken = req.csrfToken();
    res.cookie('_csrf', req.session.csrfToken, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      httpOnly: true,
    });
    console.log(
      'Generated new CSRF token:',
      req.session.csrfToken,
      'Session ID:',
      req.sessionID
    );
  } else {
    console.log(
      'Reusing CSRF token:',
      req.session.csrfToken,
      'Session ID:',
      req.sessionID
    );
  }

  // Log validation only for protected routes
  if (
    ['POST', 'PUT', 'DELETE'].includes(req.method) &&
    !['/clear-order', '/logout', '/notify/payhere'].includes(req.path)
  ) {
    const clientToken = req.headers['x-csrf-token'] || req.body._csrf;
    console.log('Validating CSRF token:', {
      clientToken,
      sessionToken: req.session.csrfToken,
      match: clientToken === req.session.csrfToken,
    });
  }

  next();
});

// -------------------- PAYMENT ROUTES --------------------
paymentApp.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: req.session.csrfToken });
});

paymentApp.post('/clear-order', (req, res) => {
  console.log('Order cleared for:', req.body);
  res.json({ success: true, message: 'Order cleared' });
});

paymentApp.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('session', {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.clearCookie('_csrf', {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    console.log('Session cleared via logout, Session ID:', req.sessionID);
    res.json({ success: true, message: 'Session cleared' });
  });
});

// ✅ Mount PayHere + after-payment routes
paymentApp.use(paymentRoutes);
paymentApp.use(afterPaymenRoutes);

app.use('/api/payments', paymentApp);
app.use('/api/after-payments', paymentApp);

// -------------------- NON-PAYMENT ROUTES --------------------
app.use('/api/package', router);
app.use('/api/include', includerouter);
app.use('/api/trending', trendrouter);
app.use('/api/admin', loginrouter);
app.use('/api/gallery', gallryRouter);

// -------------------- ROOT --------------------
app.get('/', (req, res) => res.send('API working'));

// -------------------- START --------------------
app.listen(port, () => console.log('Server starting on port ' + port));
=======
// -------------------- 1. DATABASE CONNECTION --------------------
connectDB();

// -------------------- 2. GLOBAL MIDDLEWARE --------------------

// Configure CORS
app.use(
  cors({
    // IMPORTANT: Whitelist your frontend origins
    origin: [
      'http://localhost:5173', 
      'http://localhost:5237',
      'https://ceejeey.me', 
      'http://nadevillasandtours.com',
      'https://nadevillasandtours.com',
      'http://www.nadevillasandtours.com',
      'https://www.nadevillasandtours.com',
      'http://admin.nadevillasandtours.com',
      'https://admin.nadevillasandtours.com'
    ],
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
>>>>>>> 515b6ca (Initial commit)
