import express from 'express';
import { addtrending, deleteTrendingByName } from "../controller/trendingController.js";
import upload from "../middleware/multer.js";
import adminAuth from '../middleware/adminAuth.js';
import verifyToken from '../middleware/verifyToken.js';
import TrendingModel from '../schema/trendingScehema.js';

const trendrouter = express.Router();

// ✅ Configure multer to handle all images AND the optional video field
const trendinguploadField = upload.fields([
  { name: "image", maxCount: 1 },    // main image
  { name: "image1", maxCount: 1 },
  { name: "image2", maxCount: 1 },
  { name: "image3", maxCount: 1 },
  { name: "image4", maxCount: 1 },
  { name: "image5", maxCount: 1 },
  { name: "image6", maxCount: 1 },
  { name: "video", maxCount: 1 }, // <-- ADDED: Field for the optional local video file
]);

// ➕ Add new trending item (admin only)
trendrouter.post('/add', trendinguploadField, addtrending);

// ➖ Delete trending item by name
trendrouter.delete('/delete/:name', verifyToken, deleteTrendingByName);

// 📦 Get all trending items
trendrouter.get("/trenddata", async (req, res) => {
  try {
    const trends = await TrendingModel.find();
    // OPTIONAL: If you want to control which fields are sent back (e.g., exclude large text/images), 
    // you can use .select(). However, this is fine for now.
    res.json(trends);
  } catch (err) {
    console.error("Error fetching trending data:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default trendrouter;