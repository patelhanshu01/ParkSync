import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const enableServiceWorker = () => {
  if (!('serviceWorker' in navigator)) return;
  const enabled = import.meta.env.VITE_ENABLE_SW === 'true' || import.meta.env.PROD;
  if (!enabled) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
};

enableServiceWorker();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
