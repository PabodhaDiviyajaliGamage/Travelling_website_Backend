import TrendingModel from "../schema/trendingScehema.js";
import cloudinary from "../cloudinary/cloudinary.js";

// Helper function to upload files (images or video) to Cloudinary
const uploadToCloudinary = async (file, resourceType = "image") => {
    if (!file) return null;
    try {
        const result = await cloudinary.uploader.upload(file.path, { 
            resource_type: resourceType,
            // Optional: specify a folder for better organization
            folder: `trending/${resourceType}s`,
        });
        return result.secure_url;
    } catch (error) {
        // Log the error but return null so the primary process can continue
        console.error(`Cloudinary upload failed for ${resourceType}:`, error);
        return null; 
    }
};


const addtrending = async (req, res) => {
    try {
        const {
            name,
            subname,
            description,
            availableThings,
            // REMOVED: perPersonPrice and familyPackagePrice
            location,
            highlights,
            address,
            contact,
        } = req.body;

        // The optional video file is expected from multer at req.files.video
        const videoFile = req.files.video?.[0]; 

        // ✅ Validate required fields
        if (!name || !subname || !description || !req.files?.image) {
            return res.status(400).json({ success: false, message: "Missing required fields (Name, Subname, Description, Main Image)" });
        }

        // 1. Prepare Image Files
        const imageFiles = [
            req.files.image?.[0],   // main image (required)
            req.files.image1?.[0],
            req.files.image2?.[0],
            req.files.image3?.[0],
            req.files.image4?.[0],
            req.files.image5?.[0],
            req.files.image6?.[0],
        ];

        // 2. Upload Images concurrently
        const imageUrls = await Promise.all(
            imageFiles.map(file => uploadToCloudinary(file, "image"))
        );
        
        // Ensure required main image was uploaded successfully
        if (!imageUrls[0]) {
             return res.status(500).json({ success: false, message: "Main image upload failed to Cloudinary." });
        }
        
        // 3. Upload Video (Optional)
        let videoUrl = null;
        if (videoFile) {
            // Use the helper with resourceType set to "video"
            videoUrl = await uploadToCloudinary(videoFile, "video");
            if (!videoUrl) {
                 console.warn("Optional video upload failed for:", name);
            }
        }

        // ✅ Prepare data to save in DB
        const trendingData = {
            name,
            subname,
            description,
            videoUrl, // <-- ADDED: Include the optional video URL
            
            // Image URLs
            image: imageUrls[0],
            image1: imageUrls[1],
            image2: imageUrls[2],
            image3: imageUrls[3],
            image4: imageUrls[4],
            image5: imageUrls[5],
            image6: imageUrls[6],
            
            location,
            highlights,
            address,
            contact,
            // Process availableThings from comma-separated string
            availableThings: availableThings
                ? availableThings.split(',').map(item => item.trim()).filter(item => item.length > 0)
                : [],
            
            // PRICE FIELDS REMOVED: perPersonPrice and familyPackagePrice are now gone.
        };
        

        // ✅ Save to MongoDB
        const trendingItem = new TrendingModel(trendingData);
        await trendingItem.save();

        res.json({ success: true, message: "Trending item added successfully" });
    } catch (error) {
        console.error("Error adding trending:", error);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

export { addtrending };


// The delete function remains unchanged
const deleteTrendingByName = async (req, res) => {
    const { name } = req.params;

    try {
        // Find the trending item by name and delete it
        const deletedTrending = await TrendingModel.findOneAndDelete({ name });

        if (!deletedTrending) {
            return res.status(404).json({
                success: false,
                message: `Trending item with name "${name}" not found`,
            });
        }

        res.status(200).json({
            success: true,
            message: `Trending item "${name}" deleted successfully`,
        });
    } catch (error) {
        console.error("Error deleting trending item:", error);
        res.status(500).json({
            success: false,
            message: "Server error while deleting trending item",
        });
    }
};

export { deleteTrendingByName };