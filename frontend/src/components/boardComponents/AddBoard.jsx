import React from "react";
import { FaCheck, FaTimes } from "react-icons/fa";

const AddBoard = ({
  isAddingBoard,
  newBoardCreateName,
  setNewBoardCreateName,
  setIsAddingBoard,
  handleCreateBoard,
  createBoardError,
  setCreateBoardError,
}) => {
  return (
    <div className="add-task-container">
      {isAddingBoard ? (
        <div className="add-board-wrapper">
          <input
            type="text"
            placeholder="Enter board name"
            value={newBoardCreateName}
            onChange={(e) => {
              setNewBoardCreateName(e.target.value);
              setCreateBoardError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCreateBoard();
              }
            }}
            autoFocus
          />
          {createBoardError && (
            <div className="add-board-error-message">{createBoardError}</div>
          )}
          <div className="button-container">
            <button className="tick-btn" onClick={handleCreateBoard}>
              <FaCheck className="icon icon-check" data-testid="tick-icon" />
            </button>
            <button
              className="cross-btn"
              onClick={() => {
                setIsAddingBoard(false);
                setNewBoardCreateName("");
                setCreateBoardError("");
              }}
            >
              <FaTimes className="icon icon-cross" data-testid="cross-icon" />
            </button>
          </div>
        </div>
      ) : (
        <button
          className="add-task-btn"
          onClick={() => {
            setIsAddingBoard(true);
            setNewBoardCreateName("");
            setCreateBoardError("");
          }}
        >
          <span className="thick-plus">+</span>
        </button>
      )}
    </div>
  );
};

export default AddBoard;
