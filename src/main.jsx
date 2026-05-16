import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { Toaster } from "react-hot-toast";

import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,

            style: {
              fontSize: "13px",
            },

            success: {
              style: {
                background: "#ecfdf5",
                color: "#065f46",
                border: "1px solid #6ee7b7",
              },
            },

            error: {
              style: {
                background: "#fef2f2",
                color: "#991b1b",
                border: "1px solid #fca5a5",
              },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);