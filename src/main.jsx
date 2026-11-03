import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Auto-update Service Worker cache on new release
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((reg) => {
    reg.update();
  }).catch(() => {});
}

const root = document.getElementById('root');
const application = (
  <StrictMode>
    <App />
  </StrictMode>
);
createRoot(root).render(application);
