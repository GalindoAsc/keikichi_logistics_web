import axios from "axios";
import { authStore } from "../stores/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
});

api.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken;
  if (token) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` } as any;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const refreshToken = authStore.getState().refreshToken;
        if (refreshToken) {
          const refreshResponse = await api.post("/auth/refresh", { access_token: refreshToken });
          authStore.getState().setTokens(refreshResponse.data.access_token, refreshToken);
          error.config.headers["Authorization"] = `Bearer ${refreshResponse.data.access_token}`;
          return api.request(error.config);
        }
      } catch (refreshError) {
        authStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
