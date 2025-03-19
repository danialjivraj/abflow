import axios from "axios";

const NOTIFICATIONS_API_URL = "http://localhost:5000/api/notifications";

/**
 * Fetch notifications for a specific user from the persistent store.
 * @param {string} userId - The ID of the user whose notifications are to be fetched.
 * @returns {Promise} Axios GET request resolving with the notifications data.
 */
export const fetchNotifications = (userId) => {
  return axios.get(`${NOTIFICATIONS_API_URL}/${userId}`);
};

/**
 * Delete a specific notification by its ID.
 * @param {string} notificationId - The ID of the notification to be deleted.
 * @returns {Promise} Axios DELETE request resolving when the notification is deleted.
 */
export const deleteNotification = (notificationId) => {
  return axios.delete(`${NOTIFICATIONS_API_URL}/${notificationId}`);
};

/**
 * Create a new notification in the persistent store.
 * @param {Object} notificationData - An object containing the notification details.
 * @returns {Promise} Axios POST request resolving with the created notification data.
 */
export const createNotification = (notificationData) => {
  return axios.post(`${NOTIFICATIONS_API_URL}`, notificationData);
};

/**
 * Update an existing notification with new data.
 * @param {string} notificationId - The ID of the notification to update.
 * @param {Object} updateData - An object containing the fields to update.
 * @returns {Promise} Axios PATCH request resolving with the updated notification data.
 */
export const updateNotification = (notificationId, updateData) => {
  return axios.patch(`${NOTIFICATIONS_API_URL}/${notificationId}`, updateData);
};
