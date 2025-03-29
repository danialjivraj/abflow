import React, { useState } from "react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import Column from "../../components/boardComponents/Column";
import AddBoard from "../../components/boardComponents/AddBoard";
import FilterBar from "../../components/boardComponents/FilterBar";

const BoardsView = (props) => {
  const {
    columns,
    handleDragEnd,
    isAddingBoard,
    newBoardCreateName,
    setNewBoardCreateName,
    setIsAddingBoard,
    handleCreateBoard,
    createBoardError,
    setCreateBoardError,
    isDropdownOpen,
    setIsDropdownOpen,
    isTaskDropdownOpen,
    setIsTaskDropdownOpen,
    renamingColumnId,
    newBoardName,
    setNewBoardName,
    setRenamingColumnId,
    formatDueDate,
    currentTime,
    isTaskHovered,
    setIsTaskHovered,
    deleteTask,
    startTimer,
    stopTimer,
    openViewTaskModal,
    handleCompleteTask,
    renameBoardError,
    setRenameBoardError,
    onBoardRename,
    onBoardDelete,
    confirmBeforeDeleteBoard,
    confirmBeforeDeleteTask,
    openCreateTaskModal,
    duplicateTask,
  } = props;

  const [filters, setFilters] = useState({
    taskName: "",
    priority: [],
    assignedTo: "",
    storyPoints: "",
    timerRunning: null,
    today: null,
    dueStatus: null,
    startDate: null,
    endDate: null,
  });

  const filterTasks = (tasks) => {
    return tasks.filter((task) => {
      if (
        filters.taskName &&
        !task.title.toLowerCase().includes(filters.taskName.toLowerCase())
      ) {
        return false;
      }
      if (
        filters.priority.length > 0 &&
        !filters.priority.includes(task.priority)
      ) {
        return false;
      }
      if (
        filters.assignedTo &&
        !task.assignedTo
          .toLowerCase()
          .includes(filters.assignedTo.toLowerCase())
      ) {
        return false;
      }
      if (
        filters.storyPoints &&
        task.storyPoints !== Number(filters.storyPoints)
      ) {
        return false;
      }
      if (
        filters.timerRunning !== undefined &&
        filters.timerRunning !== null &&
        task.isTimerRunning !== filters.timerRunning
      ) {
        return false;
      }
      if (filters.today !== undefined && filters.today !== null) {
        const today = new Date();
        const taskDate = new Date(task.scheduledStart || task.dueDate);
        const isToday =
          taskDate.getDate() === today.getDate() &&
          taskDate.getMonth() === today.getMonth() &&
          taskDate.getFullYear() === today.getFullYear();
        if (filters.today === true && !isToday) {
          return false;
        }
        if (filters.today === false && isToday) {
          return false;
        }
      }
      if (filters.dueStatus) {
        if (filters.dueStatus === "none") {
          if (task.dueDate) return false;
        } else if (task.dueDate) {
          const now = new Date();
          const dueDate = new Date(task.dueDate);
          if (filters.dueStatus === "due" && dueDate < now) {
            return false;
          }
          if (filters.dueStatus === "overdue" && dueDate >= now) {
            return false;
          }
        } else {
          return false;
        }
      }
      return true;
    });
  };

  return (
    <>
      <h1 className="page-title">Boards</h1>
      <FilterBar filters={filters} setFilters={setFilters} />
      <div className="kanban-container">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable
            droppableId="all-columns"
            direction="horizontal"
            type="COLUMN"
          >
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="kanban-board"
              >
                {Object.keys(columns).map((columnId, index) => {
                  const columnData = {
                    ...columns[columnId],
                    items: filterTasks(columns[columnId].items),
                  };
                  return (
                    <Column
                      key={columnId}
                      columnId={columnId}
                      columnData={columnData}
                      index={index}
                      renamingColumnId={renamingColumnId}
                      newBoardName={newBoardName}
                      setNewBoardName={setNewBoardName}
                      setRenamingColumnId={setRenamingColumnId}
                      isDropdownOpen={isDropdownOpen}
                      setIsDropdownOpen={setIsDropdownOpen}
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
                      handleCompleteTask={handleCompleteTask}
                      renameBoardError={renameBoardError}
                      setRenameBoardError={setRenameBoardError}
                      onBoardRename={onBoardRename}
                      onBoardDelete={onBoardDelete}
                      columns={columns}
                      confirmBeforeDeleteBoard={confirmBeforeDeleteBoard}
                      confirmBeforeDeleteTask={confirmBeforeDeleteTask}
                      openCreateTaskModal={openCreateTaskModal}
                      duplicateTask={duplicateTask}
                    />
                  );
                })}
                {provided.placeholder}
                <AddBoard
                  isAddingBoard={isAddingBoard}
                  newBoardCreateName={newBoardCreateName}
                  setNewBoardCreateName={setNewBoardCreateName}
                  setIsAddingBoard={setIsAddingBoard}
                  handleCreateBoard={handleCreateBoard}
                  createBoardError={createBoardError}
                  setCreateBoardError={setCreateBoardError}
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
