import React from "react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import Column from "./Column";
import AddBoard from "./AddBoard";

const BoardsView = ({
  columns,
  renamingColumnId,
  newBoardName,
  setNewBoardName,
  setRenamingColumnId,
  isDropdownOpen,
  setIsDropdownOpen,
  deleteBoard,
  renameBoard,
  dropdownRef,
  isTaskDropdownOpen,
  setIsTaskDropdownOpen,
  formatDueDate,
  currentTime,
  isTaskHovered,
  setIsTaskHovered,
  deleteTask,
  startTimer,
  stopTimer,
  openViewTaskModal,
  handleDragEnd,
  isAddingBoard,
  newBoardCreateName,
  setNewBoardCreateName,
  setIsAddingBoard,
  handleCreateBoard,
}) => {
  return (
    <>
      <h1>Boards</h1>
      <div className="kanban-container">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="all-columns" direction="horizontal" type="COLUMN">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="kanban-board"
              >
                {Object.keys(columns).map((columnId, index) => (
                  <Column
                    key={columnId}
                    columnId={columnId}
                    columnData={columns[columnId]}
                    index={index}
                    renamingColumnId={renamingColumnId}
                    newBoardName={newBoardName}
                    setNewBoardName={setNewBoardName}
                    setRenamingColumnId={setRenamingColumnId}
                    isDropdownOpen={isDropdownOpen}
                    setIsDropdownOpen={setIsDropdownOpen}
                    deleteBoard={deleteBoard}
                    renameBoard={renameBoard}
                    dropdownRef={dropdownRef}
                    isTaskDropdownOpen={isTaskDropdownOpen}
                    setIsTaskDropdownOpen={setIsTaskDropdownOpen}
                    formatDueDate={formatDueDate}
                    currentTime={currentTime}
                    isTaskHovered={isTaskHovered}
                    setIsTaskHovered={setIsTaskHovered}
                    deleteTask={deleteTask}
                    startTimer={startTimer}
                    stopTimer={stopTimer}
                    openViewTaskModal={openViewTaskModal}
                  />
                ))}
                {provided.placeholder}
                <AddBoard
                  isAddingBoard={isAddingBoard}
                  newBoardCreateName={newBoardCreateName}
                  setNewBoardCreateName={setNewBoardCreateName}
                  setIsAddingBoard={setIsAddingBoard}
                  handleCreateBoard={handleCreateBoard}
                />
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </>
  );
};

export default BoardsView;
