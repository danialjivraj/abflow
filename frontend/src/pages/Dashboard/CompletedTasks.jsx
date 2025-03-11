import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard";
import { fetchTasks, reorderTasks } from "../../services/tasksService";
import { formatDueDate } from "../../utils/dateUtils";

const CompletedTasks = ({
  userId,
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
  const [completedTasks, setCompletedTasks] = useState([]);

  useEffect(() => {
    if (!userId) return;
    const fetchCompletedTasks = async () => {
      try {
        const response = await fetchTasks(userId);
        const tasks = response.data.filter((task) => task.status === "completed");
        setCompletedTasks(tasks);
      } catch (err) {
        console.error("Error fetching completed tasks:", err);
      }
    };
  
    // Initial fetch
    fetchCompletedTasks();
  
    // Poll every 5 seconds
    const interval = setInterval(fetchCompletedTasks, 5000);
    return () => clearInterval(interval);
  }, [userId]);
  

  const handleDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;

    // Reorder tasks locally
    const updatedTasks = Array.from(completedTasks);
    const [movedTask] = updatedTasks.splice(source.index, 1);
    updatedTasks.splice(destination.index, 0, movedTask);

    // Update order for each task and persist if needed
    const updatedTasksWithOrder = updatedTasks.map((task, idx) => ({ ...task, order: idx }));
    setCompletedTasks(updatedTasksWithOrder);

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
              {completedTasks.map((task, index) => (
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
