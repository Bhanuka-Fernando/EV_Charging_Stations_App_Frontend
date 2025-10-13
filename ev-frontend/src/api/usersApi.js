import axiosClient from "./axiosClient";

const ADMIN_BASE = "/admin/staff";

// list users
async function list({ q = "", role = "All", page = 1, pageSize = 10 } = {}) {
  const params = { q, page, pageSize };
  if (role && role !== "All") params.role = role; // "Backoffice" | "Operator"

  const { data } = await axiosClient.get(ADMIN_BASE, { params });
  if (Array.isArray(data)) return { total: data.length, items: data };
  const items = data.items ?? [];
  const total = data.total ?? items.length;
  return { total, items };
}

// create staff (unchanged behavior server-side)
async function create(payload) {
  // payload: { email, password, fullName, role, phone? }
  const { data } = await axiosClient.post(ADMIN_BASE, payload);
  return data; // ideally { id, ... }; if not, we’ll handle fallback in the page
}

// update staff (we’ll use to set stationIds right after creation)
async function update(id, payload) {
  const { data } = await axiosClient.patch(`${ADMIN_BASE}/${encodeURIComponent(id)}`, payload);
  return data;
}

// convenience search by email to recover id if create() doesn’t return it
async function findByEmail(email) {
  const res = await list({ q: email, page: 1, pageSize: 1 });
  return res.items?.[0] ?? null;
}

const activate   = (id) => axiosClient.post(`${ADMIN_BASE}/${encodeURIComponent(id)}/activate`);
const deactivate = (id) => axiosClient.post(`${ADMIN_BASE}/${encodeURIComponent(id)}/deactivate`);

// profile calls you already use elsewhere
const getMyProfile     = () => axiosClient.get("/users/me/profile").then(r => r.data);
const updateMyProfile  = (payload) => axiosClient.put("/users/me/profile", payload).then(r => r.data);
const changeMyPassword = (payload) => axiosClient.put("/users/me/password", payload).then(r => r.data);

export const usersApi = {
  list,
  create,
  update,
  findByEmail,
  getMyProfile,
  updateMyProfile,
  activate, 
  deactivate, 
  changeMyPassword,
};
export default usersApi;
