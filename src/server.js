const express = require("express");
const vision = require("@google-cloud/vision");
const multer = require("multer");
const path = require("path");
const sharp = require("sharp");
const axios = require("axios"); // Add this line to import Axios

// Set up Express
const app = express();
const port = process.env.PORT || 3000;

// Set up Google Cloud Vision client with absolute path to the service account key
const client = new vision.ImageAnnotatorClient({
  keyFilename: "/Users/shivpatel/mapsnap/src/service-acccount-key.json", // Replace with your absolute path
});

// Set up Multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Middleware to parse JSON
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Health check route
app.get("/", (req, res) => {
  res.send("Server is running!");
  console.log("Health check route accessed.");
});

// Twitter API proxy route
app.get("/api/twitter-trends", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.twitter.com/1.1/trends/place.json?id=1`, // Replace with the desired location WOEID
      {
        headers: {
          Authorization: `Bearer AAAAAAAAAAAAAAAAAAAAACrnvAEAAAAA2U45dYraMJxUpLklcN9RjomxNTE%3DbHG1fBGunLJRLFkKVPFvyJjjbFsKcUfFijphRZA887SsEQW7bO`, // Replace with your Twitter API Bearer Token
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching Twitter trends:", error);
    res.status(500).send("Error fetching Twitter trends");
  }
});

// Function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

// Endpoint to check image content and log accuracy
app.post("/api/check-image", upload.single("image"), async (req, res) => {
  console.log("Received request to /api/check-image");

  try {
    let file = req.file;
    if (!file) {
      console.log("No file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("File received:", file.originalname);

    // Convert HEIC to JPEG if necessary
    if (file.mimetype === "image/heic") {
      try {
        const convertedBuffer = await sharp(file.buffer)
          .toFormat("jpeg")
          .toBuffer();
        file = {
          ...file,
          buffer: convertedBuffer,
          mimetype: "image/jpeg",
        };
        console.log("Converted file buffer size:", file.buffer.length);
        console.log("File mimetype after conversion:", file.mimetype);

        // Optionally save the buffer to a file for inspection
        require("fs").writeFileSync("converted.jpg", file.buffer);
        console.log("Converted image saved as 'converted.jpg' for inspection.");
      } catch (error) {
        console.error("Error converting HEIC file:", error);
        return res.status(500).json({ error: "Failed to convert HEIC file" });
      }
    }

    // Analyze the image using Google Cloud Vision API for safe search detection
    const [result] = await client.safeSearchDetection(file.buffer);
    console.log("Full API response:", result);

    const safeSearch = result.safeSearchAnnotation || null;

    if (!safeSearch) {
      console.log("No safe search annotations found.");
      return res
        .status(400)
        .json({ error: "No safe search annotations found." });
    }

    // Check if the image is inappropriate based on safe search detections
    const isAppropriate =
      safeSearch.adult !== "LIKELY" &&
      safeSearch.adult !== "VERY_LIKELY" &&
      safeSearch.violence !== "LIKELY" &&
      safeSearch.violence !== "VERY_LIKELY" &&
      safeSearch.racy !== "LIKELY" &&
      safeSearch.racy !== "VERY_LIKELY";

    if (!isAppropriate) {
      console.log("Image is not appropriate for upload");
      return res.json({
        safe: false,
        message: "Image is not appropriate for upload",
      });
    }

    // Proceed to calculate location accuracy (this part is independent and only for logging)
    const expectedLat = 40.7128; // Example expected latitude (New York City)
    const expectedLon = -74.006; // Example expected longitude

    // Calculate accuracy based on landmark detection and distance
    let accuracy = 0;
    if (result.landmarkAnnotations && result.landmarkAnnotations.length > 0) {
      const landmark = result.landmarkAnnotations[0];
      const landmarkLat = landmark.locations[0].latLng.latitude;
      const landmarkLon = landmark.locations[0].latLng.longitude;

      const distance = calculateDistance(
        expectedLat,
        expectedLon,
        landmarkLat,
        landmarkLon
      );

      // Define a threshold distance (e.g., 10 km)
      const threshold = 10;
      accuracy = Math.max(0, 100 - (distance / threshold) * 100);
    }

    // Log the accuracy in the console
    console.log(
      `Accuracy of the image location match: ${accuracy.toFixed(2)}%`
    );

    // Respond that the image is appropriate (this ignores accuracy calculation)
    res.json({
      safe: true,
      message: "Image uploaded successfully.",
      accuracy: accuracy.toFixed(2),
    });
  } catch (error) {
    console.error("Error checking image content:", error);
    res.status(500).json({ error: "Failed to check image content" });
  }
});

// Test route for API
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});

// Fallback route for handling SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
