import axiosClient from "./axiosClient";

const USE_SINGLE_REGISTER_ENDPOINT = false;
const REGISTER_PATH = "/auth/register";
// --- Auth ---
function login(payload) {
  
  return axiosClient.post("/auth/login", payload).then((r) => r.data);
}


function registerBackoffice(payload) {
  
  if (USE_SINGLE_REGISTER_ENDPOINT) {
    return axiosClient
      .post(REGISTER_PATH, { email: payload.email, password: payload.password, role: "Backoffice" })
      .then((r) => r.data);
  }
  return axiosClient
    .post("/auth/register/backoffice", { email: payload.email, password: payload.password, role:"Backoffice" })
    .then((r) => r.data);
}

// Operator registration (requires Backoffice JWT)
function registerOperator(payload) {
  if (USE_SINGLE_REGISTER_ENDPOINT) {
    return axiosClient
      .post(REGISTER_PATH, { email: payload.email, password: payload.password, role: "Operator" })
      .then((r) => r.data);
  }
  return axiosClient
    .post("/auth/register/operator", { email: payload.email, password: payload.password, role:"Operator" })
    .then((r) => r.data);
}

export const authApi = { login, registerBackoffice, registerOperator };
export default authApi;
