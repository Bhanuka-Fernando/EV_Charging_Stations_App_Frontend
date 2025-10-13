import axiosClient from "./axiosClient";

const toIso = (v) => {
  if (!v) return undefined;
  if (v instanceof Date) return v.toISOString();
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
};

export const bookingsApi = {
  list: async ({
    q = "",
    status,
    from,
    to,
    stationId,
    page = 1,
    pageSize = 10,
  } = {}) => {
    const params = {
      q,
      page,
      pageSize,
      ...(stationId ? { stationId } : {}),
      ...(status && status !== "All" ? { status } : {}),
      ...(toIso(from) ? { from: toIso(from) } : {}),
      ...(toIso(to) ? { to: toIso(to) } : {}),
    };

    const res = await axiosClient.get("/bookings", { params });
    return res.data;
  },

  get: async (id) => {
    const res = await axiosClient.get(`/bookings/${encodeURIComponent(id)}`);
    return res.data;
  },

  create: async (payload) => {
    const res = await axiosClient.post("/bookings", payload);
    return res.data;
  },

  update: async (id, payload) => {
    const res = await axiosClient.put(`/bookings/${encodeURIComponent(id)}`, payload);
    return res.data;
  },

  cancel: async (id) => {
    const res = await axiosClient.delete(`/bookings/${encodeURIComponent(id)}`);
    return res.data;
  },

  approve: async (id) => {
    const res = await axiosClient.post(`/bookings/${encodeURIComponent(id)}/approve`);
    return res.data;
  },

  finalize: async (id) => {
    const res = await axiosClient.post(`/bookings/${encodeURIComponent(id)}/finalize`);
    return res.data;
  },

  scan: async (code) => {
    const res = await axiosClient.post("/bookings/scan", { code });
    return res.data;
  },
};

export default bookingsApi;
