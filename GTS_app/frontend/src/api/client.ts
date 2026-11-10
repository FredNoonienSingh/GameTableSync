// Automatically uses VITE_API_URL if set (e.g. "http://localhost:5000" in local dev), 
// or falls back to relative paths ("") when running behind Nginx on the server.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const apiClient: any = {};
export default apiClient;