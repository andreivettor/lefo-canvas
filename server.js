require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

app.post("/generate", async (req, res) => {
  try {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      throw new Error("CLAUDE_API_KEY not found in environment variables");
    }

    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      req.body,
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(
      "Error calling Claude API:",
      error.response?.data || error.message
    );
    res.status(500).json({
      error: error.response?.data?.error?.message || error.message,
    });
  }
});

// Serve static files (optional)
app.use(express.static("."));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
