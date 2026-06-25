export const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:4000/api'
    : 'https://smartserve-ai-restaurant-management.onrender.com/api');

console.log("VITE_API_BASE =", import.meta.env.VITE_API_BASE);
console.log("API_BASE is set to:", API_BASE);
