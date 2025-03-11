import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard";
import { reorderTasks } from "../../services/tasksService";
import { formatDueDate } from "../../utils/dateUtils";

const CompletedTasks = ({
  completedTasks,
  currentTime,
  openViewTaskModal,
  deleteTask,
  startTimer,
  stopTimer,
  isTaskHovered,
  setIsTaskHovered,
  isTaskDropdownOpen,
  setIsTaskDropdownOpen,
}) => {
  const [localCompletedTasks, setLocalCompletedTasks] = useState(completedTasks);

  // Sync local state with prop updates
  useEffect(() => {
    setLocalCompletedTasks(completedTasks);
  }, [completedTasks]);

  const handleDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;

    // Reorder tasks locally
    const updatedTasks = Array.from(localCompletedTasks);
    const [movedTask] = updatedTasks.splice(source.index, 1);
    updatedTasks.splice(destination.index, 0, movedTask);

    // Update order for each task
    const updatedTasksWithOrder = updatedTasks.map((task, idx) => ({
      ...task,
      order: idx,
    }));

    // Update local state so the UI reflects the new order
    setLocalCompletedTasks(updatedTasksWithOrder);

    try {
      await reorderTasks(updatedTasksWithOrder);
    } catch (error) {
      console.error("Error updating completed tasks order:", error);
    }
  };

  return (
    <div className="completed-tasks-page">
      <h1>Completed Tasks</h1>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="completedTasks" type="TASK">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {localCompletedTasks.map((task, index) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  index={index}
                  formatDueDate={formatDueDate}
                  currentTime={currentTime}
                  isTaskHovered={isTaskHovered}
                  setIsTaskHovered={setIsTaskHovered}
                  isTaskDropdownOpen={isTaskDropdownOpen}
                  setIsTaskDropdownOpen={setIsTaskDropdownOpen}
                  deleteTask={deleteTask}
                  startTimer={startTimer}
                  stopTimer={stopTimer}
                  openViewTaskModal={openViewTaskModal}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default CompletedTasks;
