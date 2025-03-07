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
      if (event.data.type === "CONNECTION_RESULT") {
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

  const getAuth = async () => {
    try {
      const authData = await new Promise((resolve) => {
        window.postMessage(
          {
            type: "GET_AUTH_DATA",
          },
          "*"
        );

        function authListener(event) {
          if (event.data.type === "AUTH_DATA_RESULT") {
            window.removeEventListener("message", authListener);
            resolve(event.data);
          }
        }

        window.addEventListener("message", authListener);
      });

      console.log("Auth Data:", authData);

      if (authData.success) {
        setCookies(authData.auth.cookie);
        setCsrfToken(authData.auth["csrf-token"]);
        setAuthStatus("success");
      } else {
        setAuthStatus("error");
      }
    } catch (error) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (useApi) {
      if (!cookies || !csrfToken) {
        setStatus("Please get authentication data first!");
        return;
      }

      try {
        const result = await fetch("/api/linkedin/connect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            linkedinUrl,
            cookies,
            csrfToken,
          }),
        });

        const data = await result.json();

        if (data.status === "success") {
          setStatus("API: Connection request sent successfully!");
        } else {
          setStatus(`API Error: ${data.error}`);
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

  const [authStatus, setAuthStatus] = useState("idle"); // 'idle', 'loading', 'success', 'error'

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">LinkedIn Connection Request</h1>

      <div className="mb-4">
        <button
          onClick={() => {
            setAuthStatus("loading");
            getAuth();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded mb-4 text-white
            ${authStatus === "idle" ? "bg-gray-500" : ""}
            ${authStatus === "loading" ? "bg-gray-400" : ""}
            ${authStatus === "success" ? "bg-green-500" : ""}
            ${authStatus === "error" ? "bg-red-500" : ""}
          `}
        >
          {authStatus === "loading" && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
          Get Authentication Data
        </button>
        {/* Add auth status message */}
        {authStatus === "success" && (
          <p className="text-green-500 mt-2">Authentication successful!</p>
        )}
        {authStatus === "error" && (
          <p className="text-red-500 mt-2">Authentication failed!</p>
        )}
      </div>

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
              setAuthStatus("idle");
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
