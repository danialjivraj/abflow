import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL_DEPLOY;
const API_URL = `${BASE_URL}/api/labels`;

/**
 * Fetch all labels associated with the user.
 * @param {string} userId - The user’s ID.
 * @returns {Promise} Axios GET request that resolves with the list of labels.
 */
export const fetchLabels = (userId) => axios.get(`${API_URL}/${userId}`);

/**
 * Create a new label for the user.
 * @param {string} userId - The user’s ID.
 * @param {Object} labelData - The data for the new label (e.g., name, color).
 * @returns {Promise} Axios POST request that resolves with the created label.
 */
export const createLabel = (userId, labelData) =>
  axios.post(`${API_URL}/${userId}`, labelData);

/**
 * Update an existing label.
 * @param {string} userId - The user’s ID.
 * @param {string} labelId - The ID of the label to update.
 * @param {Object} labelData - The updated label data.
 * @returns {Promise} Axios PUT request that resolves with the updated label.
 */
export const updateLabel = (userId, labelId, labelData) =>
  axios.put(`${API_URL}/${userId}/${labelId}`, labelData);

/**
 * Delete a label.
 * @param {string} userId - The user’s ID.
 * @param {string} labelId - The ID of the label to delete.
 * @returns {Promise} Axios DELETE request that resolves when the label is deleted.
 */
export const deleteLabel = (userId, labelId) =>
  axios.delete(`${API_URL}/${userId}/${labelId}`);

/**
 * Update the order of labels.
 * @param {string} userId - The user’s ID.
 * @param {Array<Object>} labels - An array of label objects in the new order.
 * @returns {Promise} Axios PUT request that resolves with the reordered labels.
 */
export const updateLabelOrder = (userId, labels) =>
  axios.put(`${API_URL}/${userId}/reorder`, { labels });
