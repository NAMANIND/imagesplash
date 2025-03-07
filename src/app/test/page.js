"use client";
import React, { useState, useEffect } from "react";

function Page() {
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [status, setStatus] = useState("");
  const [useApi, setUseApi] = useState(false);
  const [cookies, setCookies] = useState("");
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    const messageHandler = (event) => {
      if (event.data.type === "CONNECTION_REQUEST_RESULT_WEB") {
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (useApi) {
      try {
        const result = await fetch("/api/linkedin/connect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            linkedinUrl: linkedinUrl,
          }),
        });

        const data = await result.json();

        if (data.status === "success") {
          setStatus("API: Connection request sent successfully!");
        } else {
          setStatus("API: Failed to send connection request");
        }
      } catch (error) {
        setStatus(`API Error: ${error.message}`);
      }
    } else {
      window.postMessage(
        {
          type: "SEND_CONNECTION_REQUEST",
          profileUrl: linkedinUrl,
        },
        "*"
      );
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">LinkedIn Connection Request</h1>
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={useApi}
            onChange={(e) => setUseApi(e.target.checked)}
            className="mr-2"
          />
          Use API Method
        </label>
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="url"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          placeholder="Enter LinkedIn profile URL"
          className="border p-2 w-full mb-4 text-black"
          required
        />

        <div className="flex space-x-4 gap-4">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Send Connection Request
          </button>

          <button
            type="button"
            onClick={() => {
              setLinkedinUrl("");
              setStatus("");
              setCookies("");
              setCsrfToken("");
            }}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Clear
          </button>
        </div>
      </form>
      {status && <p className="mt-4">{status}</p>}
    </div>
  );
}

export default Page;
