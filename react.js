import React from "react";

export default function DeviceStats({ devices }) {
  const total = devices.length;
  const locked = devices.filter((d) => d.status === "locked").length;

  return (
    <div>
      <h2>Total: {total}</h2>
      <h2>Locked: {locked}</h2>
    </div>
  );
}

