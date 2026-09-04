import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Application entry point.
 *
 * StrictMode is enabled to catch potential issues during development:
 * - Double-invokes effects to surface cleanup bugs
 * - Warns about deprecated APIs
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
