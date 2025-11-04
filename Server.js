import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import https from 'https';
import fs from 'fs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import csrf from 'csurf';

// Import routes
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

const app = express();
const port = process.env.PORT || 4000;

// -------------------- SECURITY MIDDLEWARE --------------------
// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Apply security middleware
app.use(limiter);
app.use(helmet());

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
    origin: [
      'http://localhost:5173', 
      'https://ceejeey.me',
      'http://nadevillasandtours.com',
      'https://nadevillasandtours.com',
      'http://www.nadevillasandtours.com',
      'https://www.nadevillasandtours.com',
      'http://admin.nadevillasandtours.com',
      'https://admin.nadevillasandtours.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------- PAYMENT APP --------------------
const paymentApp = express();

// Session configuration
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

// -------------------- CSRF PROTECTION --------------------
const csrfProtection = csrf({ cookie: false });

paymentApp.use((req, res, next) => {
  if (
    req.path === '/notify/payhere' ||
    req.path === '/clear-order' ||
    req.path === '/logout'
  ) {
    return next();
  }
  return csrfProtection(req, res, next);
});

// CSRF token management
paymentApp.use((req, res, next) => {
  if (!req.session) {
    console.error('No session found for request:', req.path);
    return res.status(500).json({ error: 'Session not initialized' });
  }

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
    console.log('Generated new CSRF token:', req.session.csrfToken);
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
    res.json({ success: true, message: 'Session cleared' });
  });
});

// Mount payment routes
app.use('/api/payments', paymentApp);
app.use('/api/after-payments', paymentApp);
app.use('/api/package', router);
app.use('/api/include', includerouter);
app.use('/api/trending', trendrouter);
app.use('/api/admin', loginrouter);
app.use('/api/gallery', gallryRouter);

// -------------------- 5. ROOT & SERVER START --------------------

app.get('/', (req, res) => res.send('API working.'));

// -------------------- SERVER STARTUP --------------------
let server;

if (process.env.NODE_ENV === 'production') {
  try {
    const sslOptions = {
      key: fs.readFileSync(process.env.SSL_KEY_PATH || '/etc/ssl/private/private.key'),
      cert: fs.readFileSync(process.env.SSL_CERT_PATH || '/etc/ssl/certs/certificate.crt'),
      ca: process.env.SSL_CA_PATH ? fs.readFileSync(process.env.SSL_CA_PATH) : undefined
    };

    server = https.createServer(sslOptions, app);
    server.listen(port, () => {
      console.log(`HTTPS Server running on port ${port} in production mode`);
    });
  } catch (error) {
    console.error('Error starting HTTPS server:', error);
    // Fallback to HTTP if SSL configuration fails
    app.listen(port, () => {
      console.log(`HTTP Server running on port ${port} (SSL fallback)`);
    });
  }
} else {
  // Development mode - HTTP
  app.listen(port, () => {
    console.log(`HTTP Server running on port ${port} in development mode`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});
