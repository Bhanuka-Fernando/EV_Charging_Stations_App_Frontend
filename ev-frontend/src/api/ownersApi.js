import axiosClient from "./axiosClient";

export const ownersApi = {
    list: async({ q = "", isActive, page = 1, pageSize = 10} = {}) => {
        const params = {q, page, pageSize};
        if(typeof isActive === "boolean") params.isActive = isActive;
        const res = await axiosClient.get("/admin/owners", {params});
        return res.data;
    },

    create: async (payload) => {
        const res = await axiosClient.post("/admin/owners", payload);
        return res.data;
    },

    get: async (nic) => {
        const res = await axiosClient.get(`/admin/owners/${encodeURIComponent(nic)}`);
        return res.data;
    },

    update: async (nic, payload) => {
        const res = await axiosClient.put(`/admin/owners/${encodeURIComponent(nic)}`, payload);
        return res.data;
    },

    activate: async (nic, reason = "Reactivated via Web") => {
        await axiosClient.patch(
            `/admin/owners/${encodeURIComponent(nic)}/status`,
            {isActive:true, reason}
        );
    },
};

export default ownersApi;