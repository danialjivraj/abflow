
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  entityType,
  entityName,
  hasTasks = false,
}) => {
  if (!isOpen) return null;

  const getMessage = () => {
    if (entityType === "task") {
      return `Are you sure you want to delete the task:<br>"${entityName}"?`;
    }
    if (entityType === "column") {
      return hasTasks
        ? `Are you sure you want to delete the board:<br>"${entityName}"?<br><br>All tasks inside will also be deleted!`
        : `Are you sure you want to delete the board:<br>"${entityName}"?`;
    }
    return "";
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container">
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="close-modal" onClick={onClose}>
            &times;
          </button>
          <h2>Confirm Deletion</h2>
          <p
            className="delete-confirmation-text"
            dangerouslySetInnerHTML={{ __html: getMessage() }}
          />
          <div className="button-group" style={{ justifyContent: "flex-end" }}>
            <button className="create-task-btn" onClick={onConfirm}>
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

export default DeleteConfirmationModal;
