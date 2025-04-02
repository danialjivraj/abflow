import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL_DEPLOY;
const API_URL = `${BASE_URL}/api/columns`;

/**
 * Create a new board (column) for a user.
 * @param {string} userId - The ID of the user.
 * @param {string} columnName - The name of the new column.
 * @returns {Promise} Axios POST request that resolves with the newly created column data.
 */
export const createBoard = (userId, columnName) => {
  return axios.post(`${API_URL}/create`, { userId, columnName });
};

/**
 * Rename an existing board (column).
 * @param {string} userId - The ID of the user.
 * @param {string} columnId - The ID of the column to rename.
 * @param {string} newName - The new name for the column.
 * @returns {Promise} Axios PUT request that resolves with the update response.
 */
export const renameBoard = (userId, columnId, newName) => {
  return axios.put(`${API_URL}/rename`, { userId, columnId, newName });
};

/**
 * Delete a board (column) and its associated tasks.
 * @param {string} userId - The ID of the user.
 * @param {string} columnId - The ID of the column to delete.
 * @returns {Promise} Axios DELETE request that resolves with the deletion response.
 */
export const deleteBoard = (userId, columnId) => {
  return axios.delete(`${API_URL}/delete`, { data: { userId, columnId } });
};

/**
 * Fetch the column order and names for a user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise} Axios GET request that resolves with the user's column data.
 */
export const fetchColumnOrder = (userId) => {
  return axios.get(`${API_URL}/order/${userId}`);
};

/**
 * Save the updated order of columns for a user.
 * @param {string} userId - The ID of the user.
 * @param {Array} columnOrder - An array of column IDs in the new order.
 * @returns {Promise} Axios PUT request that resolves with the updated column order.
 */
export const saveColumnOrder = (userId, columnOrder) => {
  return axios.put(`${API_URL}/order`, { userId, columnOrder });
};
