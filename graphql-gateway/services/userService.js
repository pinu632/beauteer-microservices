const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001/api/v1';

const userService = {
    getUserById: async (id, token) => {
        try {
            const response = await axios.get(`${USER_SERVICE_URL}/users/${id}`, {
                headers: { Authorization: token }
            });
            return response.data.data; // Assuming standard response format { status: 'success', data: { ... } }
        } catch (error) {
            console.error("Error fetching user:", error.message);
            return null;
        }
    },
    getAllUsers: async (token, role) => {
        try {
            const response = await axios.get(`${USER_SERVICE_URL}/users`, {
                headers: { Authorization: token },
                params: { role }
            });
            return response.data.data;
        } catch (error) {
            console.error("Error fetching users:", error.message);
            return [];
        }
    },
    getMyAddresses: async (token) => {
        try {
            const response = await axios.get(`${USER_SERVICE_URL}/addresses`, {
                headers: { Authorization: token }
            });
            return response.data.addresses;
        } catch (error) {
            console.error("Error fetching addresses:", error.message);
            return [];
        }
    },
    getAddressById: async (id, token) => {
        console.log(token, "token")
        try {
            const response = await axios.get(`${USER_SERVICE_URL}/addresses/${id}`, {
                headers: { Authorization: token }
            });
            return response.data.address;
        } catch (error) {
            console.error("Error fetching address:", error.message);
            return null;
        }
    }
};

module.exports = userService;
