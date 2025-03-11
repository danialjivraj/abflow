import axios from "axios";

const API_URL = "http://localhost:5000/api/tasks";

/**
 * Fetch all tasks for a user.
 * @param {string} userId
 * @returns {Promise} Axios GET request
 */
export const fetchTasks = (userId) => {
  return axios.get(`${API_URL}/${userId}`);
};

/**
 * Fetch the column order and names for a user.
 * @param {string} userId
 * @returns {Promise} Axios GET request
 */
export const fetchColumnOrder = (userId) => {
  return axios.get(`${API_URL}/columns/order/${userId}`);
};

/**
 * Create a new task.
 * @param {Object} taskData
 * @returns {Promise} Axios POST request
 */
export const createTask = (taskData) => {
  return axios.post(API_URL, taskData);
};

/**
 * Start timer for a specific task.
 * @param {string} taskId
 * @returns {Promise} Axios PUT request
 */
export const startTimerAPI = (taskId) => {
  return axios.put(`${API_URL}/${taskId}/start-timer`);
};

/**
 * Stop timer for a specific task.
 * @param {string} taskId
 * @returns {Promise} Axios PUT request
 */
export const stopTimerAPI = (taskId) => {
  return axios.put(`${API_URL}/${taskId}/stop-timer`);
};

/**
 * Delete a specific task.
 * @param {string} taskId
 * @returns {Promise} Axios DELETE request
 */
export const deleteTaskAPI = (taskId) => {
  return axios.delete(`${API_URL}/${taskId}`);
};

/**
 * Reorder tasks in a column after drag-and-drop.
 * @param {Array} tasks - array of task objects with updated 'order'
 * @returns {Promise} Axios PUT request
 */
export const reorderTasks = (tasks) => {
  return axios.put(`${API_URL}/reorder`, { tasks });
};

/**
 * Create a new board/column.
 * @param {string} userId
 * @param {string} columnName
 * @returns {Promise} Axios POST request
 */
export const createBoard = (userId, columnName) => {
  return axios.post(`${API_URL}/columns/create`, {
    userId,
    columnName,
  });
};

/**
 * Rename an existing board/column.
 * @param {string} userId
 * @param {string} columnId
 * @param {string} newName
 * @returns {Promise} Axios PUT request
 */
export const renameBoard = (userId, columnId, newName) => {
  return axios.put(`${API_URL}/columns/rename`, {
    userId,
    columnId,
    newName,
  });
};

/**
 * Delete a specific board/column.
 * @param {string} userId
 * @param {string} columnId
 * @returns {Promise} Axios DELETE request
 */
export const deleteBoard = (userId, columnId) => {
  return axios.delete(`${API_URL}/columns/delete`, {
    data: { userId, columnId },
  });
};

/**
 * Save the new column order after drag-and-drop reordering columns.
 * @param {string} userId
 * @param {Array} columnOrder - array of column IDs in the new order
 * @returns {Promise} Axios PUT request
 */
export const saveColumnOrder = (userId, columnOrder) => {
  return axios.put(`${API_URL}/columns/order`, {
    userId,
    columnOrder,
  });
};

/**
 * Update an existing task.
 * @param {Object} taskData - An object containing updated task fields, including _id.
 * @returns {Promise} Axios PUT request that resolves with the updated task.
 */
export const updateTask = (taskData) => {
  return axios.put(`${API_URL}/${taskData._id}/edit`, taskData);
};

/**
 * Mark a task as completed.
 * @param {string} taskId - The ID of the task to mark as completed.
 * @returns {Promise} Axios PUT request that resolves with the updated task.
 */
export const completeTask = (taskId) => {
  return axios.put(`${API_URL}/${taskId}/complete`);
};