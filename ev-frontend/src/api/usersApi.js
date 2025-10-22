import axiosClient from "./axiosClient";

/* ---------------- helpers ---------------- */
function normalizeUser(u = {}) {
  const id =
    u.id ?? u._id ?? u.userId ?? u.username ?? u.email ?? null;
  const isActive =
    typeof u.isActive === "boolean" ? u.isActive
    : typeof u.active   === "boolean" ? u.active
    : typeof u.IsActive === "boolean" ? u.IsActive
    : true;
  return { ...u, id, isActive };
}

function friendly(err) {
  const msg =
    err?.response?.data?.message ??
    err?.response?.data?.error ??
    err?.response?.data?.title ??
    err?.message ?? "Request failed";
  const e = new Error(msg);
  e.status = err?.response?.status;
  return e;
}

/* ---------------- Staff (admin) ---------------- */
const ADMIN_BASE = "/admin/staff";

async function list({ q = "", role = "All", page = 1, pageSize = 10 } = {}) {
  const params = { q, page, pageSize };
  if (role && role !== "All") params.role = role;
  const { data } = await axiosClient.get(ADMIN_BASE, { params });
  const rawItems = Array.isArray(data) ? data : (data.items ?? []);
  const items = rawItems.map(normalizeUser);
  const total = Array.isArray(data) ? rawItems.length : (data.total ?? items.length);
  return { total, items };
}

async function create(payload) {
  const { data } = await axiosClient.post(ADMIN_BASE, payload);
  return normalizeUser(data);
}
async function update(id, payload) {
  const { data } = await axiosClient.patch(`${ADMIN_BASE}/${encodeURIComponent(id)}`, payload);
  return normalizeUser(data);
}
async function findByEmail(email) {
  const res = await list({ q: email, page: 1, pageSize: 1 });
  return res.items?.[0] ?? null;
}
const activate   = (id) => axiosClient.post(`${ADMIN_BASE}/${encodeURIComponent(id)}/activate`);
const deactivate = (id, reason = "") => axiosClient.post(`${ADMIN_BASE}/${encodeURIComponent(id)}/deactivate`, { reason });
const setStatus  = (id, isActive, reason = "") => axiosClient.patch(`${ADMIN_BASE}/${encodeURIComponent(id)}/status`, { isActive, reason });

/* ---------------- My profile ---------------- */
async function getMyProfile() {
  const tryGet = async (path) => {
    try { const { data } = await axiosClient.get(path); return data; }
    catch (e) { if (e?.response?.status === 404) return null; throw friendly(e); }
  };

  // Prefer rich endpoint
  let data = await tryGet("/users/me/profile");
  if (!data) data = await tryGet("/me/profile");
  if (!data) data = await tryGet("/users/me");

  // Re-hydrate if minimal
  const hasName  = !!(data?.profile?.fullName ?? data?.fullName);
  const hasPhone = !!(data?.profile?.phone ?? data?.phone);
  if ((!hasName || !hasPhone) && !data?.profile) {
    const richer = await tryGet("/users/me/profile");
    if (richer) data = richer;
  }
  return data ?? {};
}

async function updateMyProfile(payload) {
  const body = {
    email: payload.email,
    fullName: payload.fullName,
    phone: payload.phone,
  };
  try { await axiosClient.put("/users/me/profile", body); return true; }
  catch (e) { if (e?.response?.status !== 404) throw friendly(e); }
  try { await axiosClient.put("/me/profile", body); return true; }
  catch (e) { if (e?.response?.status !== 404) throw friendly(e); }
  await axiosClient.patch("/users/me/profile", body);
  return true;
}

/**
 * Change password.
 * 1) First try your backend’s *profile* endpoint (Swagger shows this path)
 *    and include fullName/phone so they don’t get wiped.
 * 2) Fall back to common dedicated password endpoints.
 */
async function changeMyPassword({ email, currentPassword, newPassword, fullName, phone }) {
  const bodyProfile = { email, currentPassword, newPassword, fullName, phone };

  try { // preferred in your API
    await axiosClient.put("/users/me/profile", bodyProfile);
    return true;
  } catch (e) {
    if (e?.response?.status !== 404) throw friendly(e);
  }

  const bodyPwOnly = { email, currentPassword, newPassword };
  const candidates = [
    { method: "put",  path: "/users/me/password" },
    { method: "put",  path: "/auth/me/password" },
    { method: "put",  path: "/me/password" },
    { method: "post", path: "/auth/change-password" },
  ];

  let last404 = null;
  for (const c of candidates) {
    try { await axiosClient[c.method](c.path, bodyPwOnly); return true; }
    catch (e) { if (e?.response?.status === 404) { last404 = e; continue; } throw friendly(e); }
  }
  throw friendly(last404 ?? new Error("Password endpoint not found"));
}

export const usersApi = {
  // staff
  list, create, update, findByEmail, activate, deactivate, setStatus,
  // profile
  getMyProfile, updateMyProfile, changeMyPassword,
};
export default usersApi;
