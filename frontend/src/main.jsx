import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initializePerformanceOptimizations } from './utils/performance'
import { setupLazyLoading, setupScrollAnimations } from './utils/lazyLoading'

// Initialize performance optimizations
initializePerformanceOptimizations();

// Setup lazy loading and scroll animations
document.addEventListener('DOMContentLoaded', () => {
  setupLazyLoading();
  setupScrollAnimations();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
