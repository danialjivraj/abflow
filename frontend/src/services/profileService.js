import axios from "axios";

const API_URL = "http://localhost:5000/api/profile";

/**
 * Fetch the user’s profile data.
 * @param {string} userId - The user’s ID.
 * @returns {Promise} Axios GET request that resolves with the profile data.
 */
export const fetchProfile = (userId) => {
  return axios.get(`${API_URL}/${userId}`);
};

/**
 * Upload or update the user’s profile picture.
 * @param {string} userId - The user’s ID.
 * @param {File} file - The file object of the new picture.
 * @returns {Promise} Axios POST request that resolves with the updated picture info.
 */
export const uploadProfilePicture = (userId, file) => {
  const formData = new FormData();
  formData.append("profilePicture", file);

  return axios.post(`${API_URL}/uploadProfilePicture/${userId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/**
 * Remove the user’s profile picture (revert to default).
 * @param {string} userId - The user’s ID.
 * @returns {Promise} Axios PUT request that resolves with the new profile info.
 */
export const removeProfilePicture = (userId) => {
  return axios.put(`${API_URL}/removeProfilePicture/${userId}`);
};

/**
 * Update the user’s name.
 * @param {string} userId - The user’s ID.
 * @param {string} name - The new name to set.
 * @returns {Promise} Axios PUT request that resolves with the updated name.
 */
export const updateName = (userId, name) => {
  return axios.put(`${API_URL}/updateName/${userId}`, { name });
};
