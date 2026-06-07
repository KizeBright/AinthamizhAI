import axios from "axios";

let tokenProvider = null;

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 60000,
});

API.interceptors.request.use(async (config) => {
  if (tokenProvider) {
    const token = await tokenProvider();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export const setAuthTokenProvider = (provider) => {
  tokenProvider = provider;
};

export default API;
