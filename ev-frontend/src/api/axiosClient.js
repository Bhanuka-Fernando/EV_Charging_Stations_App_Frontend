import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://localhost:7217/api",
});

axiosClient.interceptors.request.use((config) => {
  const t = localStorage.getItem("token"); // ✅ align with AuthContext
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

axiosClient.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Request failed";
    return Promise.reject(new Error(msg));
  }
);

export default axiosClient;
