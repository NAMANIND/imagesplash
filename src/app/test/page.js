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
      // Security check - verify the sender origin if needed
      // const allowedOrigins = ['chrome-extension://your-extension-id', 'http://localhost:3000'];
      // if (!allowedOrigins.includes(event.origin)) return;

      console.log("Received message:", event.data);

      switch (event.data.type) {
        case "CONNECTION_RESULT":
          handleConnectionResult(event.data);
          break;

        case "GET_USER_ID":
          handleGetUserId();
          break;

        case "GET_AUTH_DATA":
          // If you need to handle auth data requests
          handleAuthData();
          break;

        default:
          console.log("Unknown message type:", event.data.type);
      }
    };

    const handleConnectionResult = (data) => {
      if (data.success) {
        setStatus("Connection request sent successfully!");
        // Additional success handling if needed
        // toast.success("Connection request sent!");
      } else {
        setStatus(`Error: ${data.error}`);
        // Error handling
        // toast.error(data.error);
      }
    };

    const handleGetUserId = async () => {
      try {
        // You might want to get this from your auth context/state
        const userId = await getUserIdFromContext(); // Replace with your actual method

        // Add retry mechanism
        let retryCount = 0;
        const sendResponse = () => {
          console.log("Sending user ID response:", userId);
          window.postMessage(
            {
              type: "GET_USER_ID_RESPONSE",
              userId: userId,
              success: true,
              timestamp: Date.now(), // Helpful for debugging
            },
            "*"
          );
        };

        const confirmResponse = () => {
          if (retryCount < 3) {
            sendResponse();
            retryCount++;
            setTimeout(confirmResponse, 1000); // Retry every second up to 3 times
          }
        };

        confirmResponse();
      } catch (error) {
        console.error("Error getting user ID:", error);
        window.postMessage(
          {
            type: "GET_USER_ID_RESPONSE",
            success: false,
            error: "Failed to get user ID",
          },
          "*"
        );
      }
    };

    const handleAuthData = () => {
      // Handle auth data requests if needed
      // Similar pattern to handleGetUserId
    };

    // Add message listener
    window.addEventListener("message", messageHandler);

    // Cleanup
    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, []); // Empty dependency array since we don't use any external variables

  // Helper function to get userId from your auth context/state
  const getUserIdFromContext = async () => {
    // Replace this with your actual implementation
    // Example:
    // return authContext.userId || localStorage.getItem('userId');
    return "01JNZX618BH55E1HQGZ5CWB31J";
  };

  const getAuth = async () => {
    try {
      const authData = await new Promise((resolve) => {
        window.postMessage(
          {
            type: "GET_AUTH_DATA",
            userId: "01JNZX618BH55E1HQGZ5CWB31J",
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
          {cookies ? "Connected" : "Get Auth Data"}
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
