import axios from "axios";

const API_URL = "http://localhost:5000/api/preferences";

/**
 * Fetch user chart filter preferences.
 * @param {string} userId
 * @returns {Promise} Axios GET request
 */
export const fetchChartPreferences = (userId) => {
  return axios.get(`${API_URL}/${userId}`);
};

/**
 * Update user chart filter preferences.
 * @param {string} userId
 * @param {Object} preferences
 * @returns {Promise} Axios PUT request
 */
export const updateChartPreferences = (userId, preferences) => {
  return axios.put(`${API_URL}/${userId}`, { preferences });
};
