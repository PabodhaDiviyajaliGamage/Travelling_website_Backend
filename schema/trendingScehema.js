import mongoose from "mongoose";

const trendingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subname: { type: String, required: true },
  description: { type: String, required: true },

  // New field for the optional video URL (not required)
  videoUrl: { type: String }, 

  // Images
  image: { type: String, required: true },   // Main image
  image1: { type: String, required: true },
  image2: { type: String, required: true },
  image3: { type: String, required: true },
  image4: { type: String, required: true },
  image5: { type: String, required: true },
  image6: { type: String, required: true },

  // Optional Info
  location: { type: String },
  highlights: { type: String },
  address: { type: String },
  contact: { type: String },

  // Other fields
  availableThings: [{ type: String }],    // Array of available things

  // PRICE FIELDS REMOVED:
  // perPersonPrice: { type: Number },
  // familyPackagePrice: { type: String }, 

}, { minimize: false, timestamps: true });

const TrendingModel = mongoose.models.Trending || mongoose.model("Trending", trendingSchema);
export default TrendingModel;