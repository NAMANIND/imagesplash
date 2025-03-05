"use client";
import React, { useState, useEffect } from "react";

function Page() {
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    // Listen for the response from the extension
    const messageHandler = (event) => {
      if (event.data.type === "CONNECTION_REQUEST_RESULT") {
        if (event.data.success) {
          setStatus("Connection request sent successfully!");
        } else {
          setStatus(`Error: ${event.data.error}`);
        }
      }
    };

    window.addEventListener("message", messageHandler);
    return () => window.removeEventListener("message", messageHandler);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Send message to extension
    window.postMessage(
      {
        type: "SEND_CONNECTION_REQUEST",
        linkedinUrl: linkedinUrl,
      },
      "*"
    );
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">LinkedIn Connection Request</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="url"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          placeholder="Enter LinkedIn profile URL"
          className="border p-2 w-full mb-4"
          required
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Send Connection Request
        </button>
      </form>
      {status && <p className="mt-4">{status}</p>}
    </div>
  );
}

export default Page;
