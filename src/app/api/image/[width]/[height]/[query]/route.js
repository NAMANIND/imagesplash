import { NextResponse } from "next/server";
import axios from "axios";
import NodeCache from "node-cache";

// Initialize cache with a default TTL of 1 hour (3600 seconds)
const cache = new NodeCache({ stdTTL: 3600 });

export async function GET(req) {
  const { pathname } = new URL(req.url);
  const [, , width, height, ...queryParts] = pathname.split("/").slice(-5);
  const query = decodeURIComponent(queryParts.join(" "));

  try {
    // Check cache for previously fetched results
    const cachedImageUrl = cache.get(query);
    if (cachedImageUrl) {
      // If found in cache, return the cached image URL
      const cachedUrl = `${cachedImageUrl}&w=${width}&h=${height}&fit=crop`;
      return NextResponse.redirect(cachedUrl);
    }

    // If not found in cache, fetch images from Unsplash API
    const response = await axios.get("https://api.unsplash.com/search/photos", {
      params: { query },
      headers: {
        Authorization: `Client-ID E4zFgd4aH1gTdHjvw8GsesGjuJa0b8ohUNkBy2EFQV8`,
      },
    });

    const results = response.data.results;

    if (results.length === 0) {
      return NextResponse.json({ error: "No images found" }, { status: 404 });
    }

    // Keyword extraction and ranking logic
    const keywords = extractKeywords(query); // Simple keyword extraction
    const rankedImages = rankImages(results, keywords);

    // Get the top-ranked image URL
    const topImageUrl = rankedImages[0].urls.raw;
    const modifiedUrl = `${topImageUrl}&w=${width}&h=${height}&fit=crop`;

    // Cache the top image result for 1 hour
    cache.set(query, topImageUrl);

    // Redirect to the top image URL
    return NextResponse.redirect(modifiedUrl);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching image" },
      { status: 500 }
    );
  }
}

// Helper function to extract keywords (basic tokenization)
function extractKeywords(text) {
  const stopwords = ["the", "on", "in", "with", "a", "an", "and", "is"];
  const words = text.toLowerCase().split(/\s+/);
  return words.filter((word) => !stopwords.includes(word));
}

// Helper function to rank images based on keyword matching
function rankImages(images, keywords) {
  return images
    .map((image) => {
      const description = image.description || "";
      const altDescription = image.alt_description || "";
      const matchCount = keywords.reduce((acc, keyword) => {
        return (
          acc +
          (description.includes(keyword) || altDescription.includes(keyword)
            ? 1
            : 0)
        );
      }, 0);
      return { ...image, matchScore: matchCount };
    })
    .sort((a, b) => b.matchScore - a.matchScore); // Sort by match score
}
