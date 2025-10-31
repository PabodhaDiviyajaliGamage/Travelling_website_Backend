import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongodb.js';

import trendrouter from './router/trendingRouter.js';
import loginrouter from './controller/logincontroller.js';

const app = express();

// -------------------- 1. DATABASE CONNECTION --------------------
connectDB();

// -------------------- 2. GLOBAL MIDDLEWARE --------------------
app.use(
  cors({
    origin: [
      'http://localhost:5173',
     
      'http://localhost:5237',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug log
app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.path);
  next();
});

// -------------------- 3. ROUTES --------------------
app.use('/api/admin', loginrouter);
app.use('/api/trending', trendrouter);

// -------------------- 4. ROOT --------------------
app.get('/', (req, res) => {
  res.send('API working on Vercel 🚀');
});

// -------------------- 5. EXPORT FOR SERVERLESS --------------------
export default app;
