import { useState, useEffect } from "react";
import { FiEdit, FiTrash } from "react-icons/fi";
import { toast } from "react-toastify";
import {
  createLabel,
  updateLabel,
  deleteLabel,
  updateLabelOrder,
} from "../../services/labelsService";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const predefinedColors = [
  "#d32f2f", // Red
  "#f57c00", // Orange
  "#f57f17", // Dark Amber
  "#afb42b", // Yellow-green
  "#388e3c", // Green
  "#00796b", // Teal
  "#00838f", // Cyan
  "#1976d2", // Blue
  "#283593", // Indigo
  "#7b1fa2", // Violet
  "#c2185b", // Magenta
  "#ad1457", // Red-magenta
];

const LabelsModal = ({ isOpen, closeModal, labels, setLabels, userId }) => {
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState(predefinedColors[0]);

  const [editingLabelIndex, setEditingLabelIndex] = useState(null);
  const [editedLabel, setEditedLabel] = useState("");
  const [editedColor, setEditedColor] = useState("");

  const activeColor = editingLabelIndex !== null ? editedColor : newColor;
  const [labelError, setLabelError] = useState("");
  const [editError, setEditError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNewLabel("");
      setNewColor(predefinedColors[0]);
      setLabelError("");
    }
  }, [isOpen]);

  const handleColorChange = (color) => {
    if (editingLabelIndex !== null) {
      setEditedColor(color);
    } else {
      setNewColor(color);
    }
  };

  const handleAddLabel = async () => {
    try {
      if (!newLabel.trim()) {
        setLabelError("Field cannot be empty");
        return;
      }
      if (newLabel.length > 75) {
        toast.error("Label must be 75 characters or less");
        return;
      }
      setLabelError("");

      const response = await createLabel(userId, {
        title: newLabel,
        color: newColor,
      });
      setLabels([...labels, response.data]);
      toast.success("Label created!");

      setNewLabel("");
      setNewColor(predefinedColors[0]);
    } catch (error) {
      console.error("Error: " + error.message);
      if (error.response && error.response.data && error.response.data.error) {
        setLabelError(error.response.data.error);
      } else {
        toast.error("Error creating label!");
      }
    }
  };

  const handleStartEditing = (index) => {
    setEditingLabelIndex(index);
    setEditedLabel(labels[index].title);
    setEditedColor(labels[index].color);
  };

  const handleSaveEditing = async (index) => {
    try {
      if (editedLabel.length > 75) {
        toast.error("Label must be 75 characters or less");
        return;
      }
      setEditError("");

      const labelToUpdate = labels[index];
      const response = await updateLabel(userId, labelToUpdate._id, {
        title: editedLabel,
        color: editedColor,
      });

      const updatedList = labels.map((lbl, i) =>
        i === index ? response.data : lbl,
      );
      setLabels(updatedList);

      setEditingLabelIndex(null);
      setEditedLabel("");
      setEditedColor("");
      toast.success("Label updated!");
    } catch (error) {
      console.error("Error: " + error.message);
      if (error.response && error.response.data && error.response.data.error) {
        setEditError(error.response.data.error);
      } else {
        toast.error("Error updating label!");
      }
    }
  };

  const handleCancelEditing = () => {
    setEditingLabelIndex(null);
    setEditedLabel("");
    setEditedColor("");
  };

  const handleDeleteLabel = async (index) => {
    try {
      const labelToDelete = labels[index];
      await deleteLabel(userId, labelToDelete._id);
      setLabels(labels.filter((_, i) => i !== index));
      toast.success("Label deleted!");
    } catch (error) {
      console.error("Error: " + error.message);
      toast.error("Error deleting label!");
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const reorderedLabels = Array.from(labels);
    const [movedLabel] = reorderedLabels.splice(result.source.index, 1);
    reorderedLabels.splice(result.destination.index, 0, movedLabel);

    const updatedLabels = reorderedLabels.map((label, index) => ({
      ...label,
      order: index,
    }));

    setLabels(updatedLabels);
    await updateLabelOrder(userId, updatedLabels);
  };

  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (editingLabelIndex !== null) {
      const confirmClose = window.confirm(
        "You have unsaved changes. Are you sure you want to close?",
      );
      if (!confirmClose) {
        return;
      }
      handleCancelEditing();
    }
    closeModal();
  };

  const handleCloseModal = () => {
    handleCancelEditing();
    closeModal();
  };

  const stopPropagation = (e) => e.stopPropagation();

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleAddLabel();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container label-modal" onClick={stopPropagation}>
        <div className="modal-content label-modal-content">
          <button className="close-modal" onClick={handleCloseModal}>
            &times;
          </button>
          <h2>Labels</h2>
          <div className="modal-body label-modal-body split">
            {/* LEFT COLUMN: Single color picker (used for new OR editing) */}
            <div className="add-label-column">
              <h3>
                {editingLabelIndex !== null
                  ? "Edit Label Color"
                  : "Add New Label"}
              </h3>

              {editingLabelIndex === null && (
                <>
                  <input
                    type="text"
                    placeholder="Label name"
                    value={newLabel}
                    onChange={(e) => {
                      setNewLabel(e.target.value);
                      if (e.target.value.trim() !== "") {
                        setLabelError("");
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    className="label-name-input"
                    maxLength={75}
                  />
                  {labelError && <p className="error-message">{labelError}</p>}
                </>
              )}

              <div className="color-picker-container">
                <div className="section-label">Preset</div>
                <div className="preset-row">
                  {predefinedColors.map((color) => (
                    <div
                      key={color}
                      className={`color-circle ${
                        activeColor === color ? "selected" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorChange(color)}
                    />
                  ))}
                </div>
                <div className="custom-color">
                  <div className="section-label">Custom</div>
                  <div className="custom-row">
                    <div
                      className="custom-color-toggle"
                      style={{ backgroundColor: activeColor }}
                    >
                      <input
                        type="color"
                        className="color-input-overlay"
                        value={activeColor}
                        onChange={(e) => handleColorChange(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {editingLabelIndex === null && (
                <button className="create-task-btn" onClick={handleAddLabel}>
                  Add Label
                </button>
              )}

              {editingLabelIndex !== null && (
                <p className="note">
                  Pick a new color here. Label name is edited on the right.
                </p>
              )}
            </div>

            {/* RIGHT COLUMN: Existing Labels (with inline editing for title only) */}
            <div className="labels-column">
              <h3>Existing Labels</h3>
              {labels.length === 0 ? (
                <div className="no-labels">No labels available</div>
              ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="labels">
                    {(provided) => (
                      <div
                        className="labels-container"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {labels.map((label, index) => (
                          <Draggable
                            key={label._id}
                            draggableId={label._id}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                className="label-row"
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <span
                                  className="label-color-box"
                                  style={{
                                    backgroundColor:
                                      editingLabelIndex === index
                                        ? editedColor
                                        : label.color,
                                  }}
                                />
                                {editingLabelIndex === index ? (
                                  <div className="inline-edit-input-wrapper">
                                    <input
                                      type="text"
                                      value={editedLabel}
                                      onChange={(e) => {
                                        setEditedLabel(e.target.value);
                                        setEditError("");
                                      }}
                                      className="inline-edit-input"
                                      maxLength={75}
                                    />
                                    {editError && (
                                      <span className="error-message-inline">
                                        {editError}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="label-title">
                                    {label.title}
                                  </span>
                                )}
                                {editingLabelIndex !== index && (
                                  <div className="label-actions">
                                    <button
                                      className="edit-btn"
                                      onClick={() => {
                                        setEditError("");
                                        handleStartEditing(index);
                                      }}
                                    >
                                      <FiEdit size={14} />
                                    </button>
                                    <button
                                      className="delete-btn"
                                      onClick={() => handleDeleteLabel(index)}
                                    >
                                      <FiTrash size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>
          </div>

          <div className="modal-footer">
            {editingLabelIndex !== null ? (
              <>
                <button
                  className="create-task-btn"
                  onClick={() => handleSaveEditing(editingLabelIndex)}
                >
                  Save
                </button>
                <button className="cancel-btn" onClick={handleCancelEditing}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="cancel-btn" onClick={handleCloseModal}>
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelsModal;
