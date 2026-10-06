// ============================================================
// STATUS BANNER — Overlaid camera messages
// ============================================================
import React from 'react';

export default function StatusBanner({ message, type = 'info' }) {
  if (!message) return null;
  return (
    <div
      className={`status-banner ${type}`}
      role="alert"
      aria-live="assertive"
      id="status-banner"
    >
      {message}
    </div>
  );
}
