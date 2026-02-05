
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';

// --- INTEGRASI SENTRY UNTUK ERROR MONITORING ---
// Di aplikasi production, Anda akan menginstal @sentry/react dan menginisialisasi Sentry.
// import * as Sentry from "@sentry/react";
//
// Sentry.init({
//   dsn: process.env.SENTRY_DSN, // DSN didapatkan dari akun Sentry Anda dan ditambahkan sebagai "Secret"
//   integrations: [
//     Sentry.browserTracingIntegration(),
//     Sentry.replayIntegration(),
//   ],
//   // Atur persentase sampling sesuai kebutuhan
//   tracesSampleRate: 1.0, 
//   replaysSessionSampleRate: 0.1,
//   replaysOnErrorSampleRate: 1.0,
// });
// --- END OF SENTRY INTEGRATION ---


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
