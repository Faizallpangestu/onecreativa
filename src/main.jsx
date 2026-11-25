import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Auto-update Service Worker cache on new release, purge on localhost
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister();
      }
    }).catch(() => { });
    if (window.caches) {
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name);
        }
      }).catch(() => { });
    }
  } else {
    navigator.serviceWorker.ready.then((reg) => {
      reg.update();
    }).catch(() => { });
  }
}

const root = document.getElementById('root');
const application = (
  <StrictMode>
    <App />
  </StrictMode>
);
createRoot(root).render(application);
