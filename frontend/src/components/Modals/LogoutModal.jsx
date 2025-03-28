import React from "react";
import { auth } from "../../firebase";

const LogoutModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    auth.signOut();
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container">
        <div className="modal-content">
          <button className="close-modal" onClick={onClose}>
            &times;
          </button>
          <h2>Confirm Logout</h2>
          <p>Are you sure you want to log out?</p>
          <div className="modal-footer">
            <button className="create-task-btn" onClick={handleConfirm}>
              Yes
            </button>
            <button className="cancel-btn" onClick={onClose}>
              No
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
