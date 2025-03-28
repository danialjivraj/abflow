import axios from "axios";

const BASE_URL = process.env.VITE_API_BASE_URL_DEPLOY;
const API_URL = `${BASE_URL}/api/preferences`;

/**
 * Fetch user chart preferences.
 * @param {string} userId
 * @returns {Promise} Axios GET request
 */
export const fetchChartPreferences = (userId) => {
  return axios.get(`${API_URL}/${userId}`);
};

/**
 * Update user chart preferences.
 * @param {string} userId
 * @param {Object} preferences
 * @returns {Promise} Axios PUT request
 */
export const updateChartPreferences = (userId, preferences) => {
  return axios.put(`${API_URL}/${userId}`, { chartPreferences: preferences });
};

/**
 * Fetch user settings preferences.
 * @param {string} userId
 * @returns {Promise} Axios GET request
 */
export const fetchSettingsPreferences = (userId) => {
  return axios.get(`${API_URL}/${userId}`);
};

/**
 * Update user settings preferences.
 * @param {string} userId
 * @param {Object} preferences
 * @returns {Promise} Axios PUT request
 */
export const updateSettingsPreferences = (userId, preferences) => {
  return axios.put(`${API_URL}/${userId}`, { settingsPreferences: preferences });
};