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

// create staff
async function create(payload) {
  const { data } = await axiosClient.post(ADMIN_BASE, payload);
  return data;
}

// update staff (profile/role/stations)
async function update(id, payload) {
  const { data } = await axiosClient.patch(`${ADMIN_BASE}/${encodeURIComponent(id)}`, payload);
  return data;
}

// convenience search by email
async function findByEmail(email) {
  const res = await list({ q: email, page: 1, pageSize: 1 });
  return res.items?.[0] ?? null;
}

// status endpoints
const activate   = (id) => axiosClient.post(`${ADMIN_BASE}/${encodeURIComponent(id)}/activate`);
const deactivate = (id) => axiosClient.post(`${ADMIN_BASE}/${encodeURIComponent(id)}/deactivate`);

// profile (unchanged)
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
