// /pages/api/parse-travel-details.js

import axios from "axios";
import { NextResponse } from "next/server";

const OPENAI_API_KEY = "";

export async function POST(req) {
  const { text } = await req.json();

  if (!text) {
    return NextResponse.json(
      { error: "Text input is required" },
      { status: 400 }
    );
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          {
            role: "user",
            content: `Extract travel details from the following text and return as JSON with dates in the "YYYY-MM-DD" format. If the year is not mentioned, use the current year: "${text}"`,
          },
        ],
        temperature: 0.2,
        top_p: 1,
        n: 1,
        stream: false,
        stop: null,
        presence_penalty: 0.0,
        frequency_penalty: 0.0,
        max_tokens: 150,
        functions: [
          {
            name: "extract_travel_details",
            description: "Extracts travel details from a given text.",
            parameters: {
              type: "object",
              properties: {
                lat: { type: "number" },
                lng: { type: "number" },
                name: { type: "string" },
                startDate: { type: "string" },
                endDate: { type: "string" },
                rooms: { type: "integer" },
                people: { type: "integer" },
              },
              required: ["name", "lat", "lng"],
            },
          },
        ],
        function_call: { name: "extract_travel_details" },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const result = JSON.parse(
      response.data.choices[0].message.function_call.arguments
    );

    const structuredData = {
      name: result.name || null,
      lat: result.lat || null,
      lng: result.lng || null,
      startDate: result.startDate || null,
      endDate: result.endDate || null,
      rooms: result.rooms || null,
      people: result.people || null,
    };

    return NextResponse.json(structuredData);
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return NextResponse.json(
      { error: "Failed to process the request" },
      { status: 500 }
    );
  }
}
