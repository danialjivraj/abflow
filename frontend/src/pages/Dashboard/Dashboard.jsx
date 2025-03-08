import React, { useEffect, useState, useRef } from "react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import Layout from "../../components/Layout";
import TopBar from "../../components/TopBar";
import { topBarConfig } from "../../config/topBarConfig";
import CreateTaskModal from "./CreateTaskModal";
import Column from "./Column";
import AddBoard from "./AddBoard";
import { auth } from "../../firebase";
import {
  fetchTasks,
  fetchColumnOrder,
  createBoard,
  renameBoard,
  deleteBoard,
  createTask,
  reorderTasks,
  saveColumnOrder,
  startTimerAPI,
  stopTimerAPI,
  deleteTaskAPI,
} from "../../services/tasksService";
import { formatDueDate } from "../../utils/dateUtils";
import "../../components/styles.css";
import "../../components/topBar.css";
import "../../components/tipTapEditor.css";

const Dashboard = () => {
  // ---------------------- state and refs ----------------------
  const [columns, setColumns] = useState({});
  const [userId, setUserId] = useState(null);
  const [renamingColumnId, setRenamingColumnId] = useState(null);
  const [newBoardName, setNewBoardName] = useState("");
  const [isAddingBoard, setIsAddingBoard] = useState(false);
  const [newBoardCreateName, setNewBoardCreateName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(null);
  const [isTaskDropdownOpen, setIsTaskDropdownOpen] = useState(null);
  const [isTaskHovered, setIsTaskHovered] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const dropdownRef = useRef(null);
  // --- state for submitting tasks ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  // --- states for creating a task ---
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("A1");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [dueDate, setDueDate] = useState(null);
  const [assignedTo, setAssignedTo] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  // --- errors and warnings for creating a task ---
  const [errorMessage, setErrorMessage] = useState("");
  const [dueDateWarning, setDueDateWarning] = useState("");

  // ---------------------- side effects ----------------------
  // sets current user from firebase
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserId(currentUser.uid);
    }
  }, []);

  // fetches tasks and column order for the user
  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      try {
        const [tasksRes, columnOrderRes] = await Promise.all([
          fetchTasks(userId),
          fetchColumnOrder(userId),
        ]);
        const { columnOrder, columnNames = {} } = columnOrderRes.data;
        const fetchedTasks = tasksRes.data;
        const groupedTasks = {};
        columnOrder.forEach((colId) => {
          groupedTasks[colId] = {
            name: columnNames[colId] || colId,
            items: [],
          };
        });
        fetchedTasks.forEach((task) => {
          if (groupedTasks[task.status]) {
            groupedTasks[task.status].items.push({
              ...task,
              isTimerRunning: task.isTimerRunning || false,
              timerStartTime: task.timerStartTime || null,
            });
          }
        });
        setColumns(groupedTasks);
        // sets default selectedStatus to the first column, if not set
        if (columnOrder.length > 0 && !selectedStatus) {
          setSelectedStatus(columnOrder[0]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, [userId, selectedStatus]);

  // updates current time every second for dynamic updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // closes dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(null);
        setIsTaskDropdownOpen(null);
        setIsTaskHovered(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ---------------------- handlers ----------------------
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    resetForm();
    setIsModalOpen(false);
  };

  const handleCreateBoard = async () => {
    if (!newBoardCreateName.trim() || !userId) return;
    try {
      const res = await createBoard(userId, newBoardCreateName);
      const { columnId, columnName } = res.data;
      setColumns((prev) => ({
        ...prev,
        [columnId]: { name: columnName, items: [] },
      }));
      setNewBoardCreateName("");
      setIsAddingBoard(false);
      setIsDropdownOpen(null);
    } catch (error) {
      console.error("Error creating board:", error);
    }
  };

  const handleRenameBoard = async (columnId, newName) => {
    if (!newName.trim()) return;
    try {
      await renameBoard(userId, columnId, newName);
      setColumns((prev) => ({
        ...prev,
        [columnId]: { ...prev[columnId], name: newName },
      }));
      setNewBoardName("");
      setRenamingColumnId(null);
      setIsDropdownOpen(null);
    } catch (error) {
      console.error("Error renaming board:", error);
    }
  };

  const handleDeleteBoard = async (columnId) => {
    try {
      await deleteBoard(userId, columnId);
      setColumns((prev) => {
        const updated = { ...prev };
        delete updated[columnId];
        return updated;
      });
      setIsDropdownOpen(null);
    } catch (error) {
      console.error("Error deleting board:", error);
    }
  };

  // deletes task handler
  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTaskAPI(taskId);
      setColumns((prevColumns) => {
        const updatedColumns = { ...prevColumns };
        Object.keys(updatedColumns).forEach((colId) => {
          updatedColumns[colId].items = updatedColumns[colId].items.filter(
            (task) => task._id !== taskId
          );
        });
        return updatedColumns;
      });
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // timer handler for starting the timer
  const updateTaskInColumns = (taskId, updates) => {
    setColumns((prevColumns) => {
      const updatedColumns = { ...prevColumns };
      Object.keys(updatedColumns).forEach((colId) => {
        updatedColumns[colId].items = updatedColumns[colId].items.map((task) =>
          task._id === taskId ? { ...task, ...updates } : task
        );
      });
      return updatedColumns;
    });
  };

  const handleStartTimer = async (taskId) => {
    try {
      const response = await startTimerAPI(taskId);
      const updatedTask = response.data;
      updateTaskInColumns(taskId, {
        isTimerRunning: true,
        timerStartTime: updatedTask.timerStartTime || new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error starting timer:", error);
    }
  };

  const handleStopTimer = async (taskId) => {
    try {
      await stopTimerAPI(taskId);
      updateTaskInColumns(taskId, {
        isTimerRunning: false,
        timerStartTime: null,
      });
    } catch (error) {
      console.error("Error stopping timer:", error);
    }
  };

  const resetForm = () => {
    setNewTaskTitle("");
    setSelectedPriority("A1");
    setSelectedStatus("");
    setDueDate(null);
    setAssignedTo("");
    setTaskDescription("");
    setErrorMessage("");
    setDueDateWarning("");
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      setErrorMessage("Task Title is required.");
      return;
    }
    if (!userId || isSubmitting) return;
  
    setIsSubmitting(true);
    setErrorMessage("");
  
    try {
      const taskData = {
        title: newTaskTitle,
        priority: selectedPriority,
        status: selectedStatus,
        userId,
        dueDate,
        assignedTo,
        description: taskDescription,
      };
      const response = await createTask(taskData);
      const newTask = response.data;
      setColumns((prev) => {
        const updated = { ...prev };
        if (updated[newTask.status]) {
          if (!updated[newTask.status].items.find((task) => task._id === newTask._id)) {
            updated[newTask.status].items = [...updated[newTask.status].items, newTask];
          }
        }
        return updated;
      });
      resetForm();
      closeModal();
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination, type } = result;
    if (!destination) return;

    if (type === "COLUMN") {
      const columnIds = Object.keys(columns);
      const [removed] = columnIds.splice(source.index, 1);
      columnIds.splice(destination.index, 0, removed);
      const newColumns = {};
      columnIds.forEach((colId) => {
        newColumns[colId] = columns[colId];
      });
      setColumns(newColumns);
      try {
        await saveColumnOrder(userId, columnIds);
      } catch (error) {
        console.error("Error saving column order:", error);
      }
      return;
    }

    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    if (!sourceColumn || !destColumn) return;
    const sourceItems = [...sourceColumn.items];
    const [movedItem] = sourceItems.splice(source.index, 1);
    movedItem.status = destination.droppableId;
    const destItems =
      source.droppableId === destination.droppableId
        ? sourceItems
        : [...destColumn.items];
    destItems.splice(destination.index, 0, movedItem);
    const updatedTasks = destItems.map((task, idx) => ({ ...task, order: idx }));
    const updatedColumns = {
      ...columns,
      [source.droppableId]: { ...sourceColumn, items: sourceItems },
      [destination.droppableId]: { ...destColumn, items: updatedTasks },
    };
    setColumns(updatedColumns);
    try {
      await reorderTasks(updatedTasks);
    } catch (error) {
      console.error("Error updating task order:", error);
    }
  };

  // ---------------------- render ----------------------
  return (
    <Layout openModal={openModal}>
      <TopBar buttons={topBarConfig["/dashboard"]} openModal={openModal} />
      <h1>Dashboard</h1>
      <div className="kanban-container">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="all-columns" direction="horizontal" type="COLUMN">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="kanban-board">
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
                    deleteBoard={handleDeleteBoard}
                    renameBoard={handleRenameBoard}
                    dropdownRef={dropdownRef}
                    isTaskDropdownOpen={isTaskDropdownOpen}
                    setIsTaskDropdownOpen={setIsTaskDropdownOpen}
                    formatDueDate={formatDueDate}
                    currentTime={currentTime}
                    isTaskHovered={isTaskHovered}
                    setIsTaskHovered={setIsTaskHovered}
                    deleteTask={handleDeleteTask}
                    startTimer={handleStartTimer}
                    stopTimer={handleStopTimer}
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
        <CreateTaskModal
          isModalOpen={isModalOpen}
          closeModal={closeModal}
          columns={columns}
          newTaskTitle={newTaskTitle}
          setNewTaskTitle={setNewTaskTitle}
          selectedPriority={selectedPriority}
          setSelectedPriority={setSelectedPriority}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          dueDate={dueDate}
          setDueDate={setDueDate}
          assignedTo={assignedTo}
          setAssignedTo={setAssignedTo}
          taskDescription={taskDescription}
          setTaskDescription={setTaskDescription}
          handleCreateTask={handleCreateTask}
          errorMessage={errorMessage}
          dueDateWarning={dueDateWarning}
          setDueDateWarning={setDueDateWarning}
          />
      </div>
    </Layout>
  );
};

export default Dashboard;
