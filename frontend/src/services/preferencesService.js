import axios from "axios";

const API_URL = "http://localhost:5000/api/preferences";

/**
 * Fetch user preferences.
 * @param {string} userId
 * @returns {Promise} Axios GET request
 */
export const fetchPreferences = (userId) => {
  return axios.get(`${API_URL}/${userId}`);
};

/**
 * Update user preferences.
 * @param {string} userId
 * @param {Object} preferences
 * @returns {Promise} Axios PUT request
 */
export const updatePreferences = (userId, preferences) => {
  return axios.put(`${API_URL}/${userId}`, { preferences });
};
