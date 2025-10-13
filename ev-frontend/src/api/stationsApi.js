// src/api/stationsApi.js
import axiosClient from "./axiosClient";

// helper: always return the response body (or null for 204)
const unwrap = (promise) =>
  promise.then((r) => (typeof r?.data === "undefined" ? null : r.data));

const stationsApi = {
  list: async ({ q = "", isActive, page = 1, pageSize = 10 } = {}) => {
    const params = { q, page, pageSize };
    if (typeof isActive === "boolean") params.isActive = isActive;

    const { data } = await axiosClient.get("/stations", { params });
    return data;
  },

  get: async (id) => {
    const { data } = await axiosClient.get(`/stations/${encodeURIComponent(id)}`);
    return data;
  },

  create: async (payload) => {
    const { data } = await axiosClient.post("/stations", payload);
    return data;
  },

  update: async (id, payload) => {
    const { data } = await axiosClient.put(
      `/stations/${encodeURIComponent(id)}`,
      payload
    );
    return data;
  },

  activate: async (id) => {
    // some APIs return 204 No Content; unwrap() handles that and returns null
    return unwrap(
      axiosClient.patch(`/stations/${encodeURIComponent(id)}/activate`)
    );
  },

  deactivate: async (id) => {
    return unwrap(
      axiosClient.patch(`/stations/${encodeURIComponent(id)}/deactivate`)
    );
  },

  updateSchedule: async (id, body) => {
    const { data } = await axiosClient.put(
      `/stations/${encodeURIComponent(id)}/schedule`,
      body
    );
    return data;
  },
};

export default stationsApi;
export { stationsApi };
