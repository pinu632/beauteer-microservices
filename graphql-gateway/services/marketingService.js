const axios = require('axios');

const MARKETING_SERVICE_URL = process.env.MARKETING_SERVICE_URL || 'http://localhost:3008/api/v1';

const marketingService = {
    // Campaign
    getAllCampaigns: async (token, params = {}) => {
        try {
            const response = await axios.get(`${MARKETING_SERVICE_URL}/campaigns`, {
                headers: { Authorization: token },
                params
            });
            return response.data.data;
        } catch (error) {
            console.error("Error fetching campaigns:", error.message);
            return [];
        }
    },
    getCampaignById: async (id, token) => {
        try {
            const response = await axios.get(`${MARKETING_SERVICE_URL}/campaigns/${id}`, {
                headers: { Authorization: token }
            });
            return response.data.data;
        } catch (error) {
            console.error("Error fetching campaign:", error.message);
            return null;
        }
    },
    createCampaign: async (data, token) => {
        try {
            const response = await axios.post(`${MARKETING_SERVICE_URL}/campaigns`, data, {
                headers: { Authorization: token }
            });
            return response.data.data;
        } catch (error) {
            console.error("Error creating campaign:", error.message);
            throw new Error(error.response?.data?.message || "Failed to create campaign");
        }
    },
    updateCampaign: async (id, data, token) => {
        try {
            const response = await axios.put(`${MARKETING_SERVICE_URL}/campaigns/${id}`, data, {
                headers: { Authorization: token }
            });
            return response.data.data;
        } catch (error) {
            console.error("Error updating campaign:", error.message);
            throw new Error(error.response?.data?.message || "Failed to update campaign");
        }
    },
    deleteCampaign: async (id, token) => {
        try {
            const response = await axios.delete(`${MARKETING_SERVICE_URL}/campaigns/${id}`, {
                headers: { Authorization: token }
            });
            return response.data;
        } catch (error) {
            console.error("Error deleting campaign:", error.message);
            throw new Error(error.response?.data?.message || "Failed to delete campaign");
        }
    },

    // Banner
    getAllBanners: async (token, params = {}) => {
        try {
            const response = await axios.get(`${MARKETING_SERVICE_URL}/banners`, {
                headers: { Authorization: token },
                params
            });
            return response.data.data;
        } catch (error) {
            console.error("Error fetching banners:", error.message);
            return [];
        }
    },
    getBannerById: async (id, token) => {
        try {
            const response = await axios.get(`${MARKETING_SERVICE_URL}/banners/${id}`, {
                headers: { Authorization: token }
            });
            return response.data.data;
        } catch (error) {
            console.error("Error fetching banner:", error.message);
            return null;
        }
    },
    createBanner: async (data, token) => {
        try {
            const response = await axios.post(`${MARKETING_SERVICE_URL}/banners`, data, {
                headers: { Authorization: token }
            });
            return response.data.data;
        } catch (error) {
            console.error("Error creating banner:", error.message);
            throw new Error(error.response?.data?.message || "Failed to create banner");
        }
    },
    updateBanner: async (id, data, token) => {
        try {
            const response = await axios.put(`${MARKETING_SERVICE_URL}/banners/${id}`, data, {
                headers: { Authorization: token }
            });
            return response.data.data;
        } catch (error) {
            console.error("Error updating banner:", error.message);
            throw new Error(error.response?.data?.message || "Failed to update banner");
        }
    },
    deleteBanner: async (id, token) => {
        try {
            const response = await axios.delete(`${MARKETING_SERVICE_URL}/banners/${id}`, {
                headers: { Authorization: token }
            });
            return response.data;
        } catch (error) {
            console.error("Error deleting banner:", error.message);
            throw new Error(error.response?.data?.message || "Failed to delete banner");
        }
    }
};

module.exports = marketingService;
