const getApiBase = () => {
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE;
  }
  
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) {
      // @ts-ignore
      return import.meta.env.VITE_API_BASE;
    }
  } catch (e) {}

  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:4000/api';
  }
  
  return 'https://smartserve-ai-restaurant-management.onrender.com/api';
};

export const API_BASE = getApiBase();

console.log("API_BASE is set to:", API_BASE);
