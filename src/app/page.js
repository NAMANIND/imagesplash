"use client";
import { useState } from "react";

export default function Home() {
  const [imageInput, setImageInput] = useState(
    "http://localhost:3000/api/image/800/600/sunset"
  );
  const [imageUrl, setImageUrl] = useState(imageInput);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you can add any validation or processing before setting the image URL
    setImageUrl(e.target.elements.imageUrl.value);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center text-black">
          Image Splash
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col text-gray-700 ">
            <label htmlFor="imageUrl" className="font-semibold mb-2">
              Image URL:
            </label>
            <input
              id="imageUrl"
              type="text"
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter image URL"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 px-4 rounded-lg"
          >
            Get Image
          </button>
        </form>
        <div className="mt-4">
          <img src={imageUrl} alt="Sample" className="rounded-lg shadow-lg" />
        </div>
      </div>
    </div>
  );
}
