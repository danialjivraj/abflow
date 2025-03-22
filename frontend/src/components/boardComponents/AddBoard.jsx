import React from "react";

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
            autoFocus
          />
          {createBoardError && (
            <div className="add-board-error-message">{createBoardError}</div>
          )}
          <div className="button-container">
            <button className="tick-btn" onClick={handleCreateBoard}>
              ✔️
            </button>
            <button
              className="cross-btn"
              onClick={() => {
                setIsAddingBoard(false);
                setNewBoardCreateName("");
                setCreateBoardError("");
              }}
            >
              ❌
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
