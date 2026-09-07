import React from "react";
import ReactDOM from "react-dom/client";
import DeviceCareDashboard from "./DeviceCareDashboard.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      <DeviceCareDashboard />
    </div>
  </React.StrictMode>
);
