import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(req) {
  // Extract the URL parameters from the request
  const { pathname } = new URL(req.url);
  const [, , width, height, query] = pathname.split("/").slice(-5);

  try {
    // Fetch a random image from Unsplash API
    const response = await axios.get("https://api.unsplash.com/search/photos", {
      params: { query },
      headers: {
        Authorization: `Client-ID E4zFgd4aH1gTdHjvw8GsesGjuJa0b8ohUNkBy2EFQV8`,
      },
    });

    if (response.data.results.length > 0) {
      const imageUrl = response.data.results[0].urls.raw;
      const modifiedUrl = `${imageUrl}&w=${width}&h=${height}&fit=crop`;
      return NextResponse.redirect(modifiedUrl);
    } else {
      return NextResponse.json({ error: "No images found" }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching image" },
      { status: 500 }
    );
  }
}
