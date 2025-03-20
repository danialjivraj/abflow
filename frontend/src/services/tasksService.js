import axios from "axios";

const API_URL = "http://localhost:5000/api/tasks";

/**
 * Fetch all tasks for a user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise} Axios GET request that resolves with an array of tasks.
 */
export const fetchTasks = (userId) => {
  return axios.get(`${API_URL}/${userId}`);
};

/**
 * Create a new task.
 * @param {Object} taskData - An object containing the task details.
 * @returns {Promise} Axios POST request that resolves with the newly created task.
 */
export const createTask = (taskData) => {
  return axios.post(API_URL, taskData);
};

/**
 * Update an existing task.
 * @param {Object} taskData - An object containing the updated task details (must include _id).
 * @returns {Promise} Axios PUT request that resolves with the updated task.
 */
export const updateTask = (taskData) => {
  return axios.put(`${API_URL}/${taskData._id}/edit`, taskData);
};

/**
 * Delete a specific task.
 * @param {string} taskId - The ID of the task to delete.
 * @returns {Promise} Axios DELETE request that resolves with a confirmation message.
 */
export const deleteTaskAPI = (taskId) => {
  return axios.delete(`${API_URL}/${taskId}`);
};

/**
 * Start the timer for a task.
 * @param {string} taskId - The ID of the task.
 * @returns {Promise} Axios PUT request that resolves with the updated task.
 */
export const startTimerAPI = (taskId) => {
  return axios.put(`${API_URL}/${taskId}/start-timer`);
};

/**
 * Stop the timer for a task.
 * @param {string} taskId - The ID of the task.
 * @returns {Promise} Axios PUT request that resolves with the updated task.
 */
export const stopTimerAPI = (taskId) => {
  return axios.put(`${API_URL}/${taskId}/stop-timer`);
};

/**
 * Reorder multiple tasks.
 * @param {Array} tasks - An array of task objects with updated order values.
 * @returns {Promise} Axios PUT request that resolves with a confirmation message.
 */
export const reorderTasks = (tasks) => {
  return axios.put(`${API_URL}/reorder`, { tasks });
};

/**
 * Update the schedule for a task.
 * @param {string} taskId - The ID of the task.
 * @param {Object} scheduleData - An object containing the new scheduled start and end times.
 * @returns {Promise} Axios PATCH request that resolves with the updated task.
 */
export const updateTaskSchedule = (taskId, scheduleData) => {
  return axios.patch(`${API_URL}/${taskId}/schedule`, scheduleData);
};

/**
 * Mark a task as completed.
 * @param {string} taskId - The ID of the task.
 * @returns {Promise} Axios PUT request that resolves with the updated task.
 */
export const completeTask = (taskId) => {
  return axios.put(`${API_URL}/${taskId}/complete`);
};

/**
 * Reset notification flags for a task.
 * @param {string} taskId - The ID of the task.
 * @param {Object} flags - An object containing the flags to reset.
 * @returns {Promise} Axios PUT request that resolves with the updated task.
 */
export const resetNotificationFlags = (taskId, flags) => {
  return axios.put(`${API_URL}/${taskId}/reset-notification-flags`, flags);
};
