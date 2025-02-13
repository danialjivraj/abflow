import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { auth } from "../firebase";
import TiptapEditor from "../components/TiptapEditor.jsx";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../components/styles.css";
import Layout from "../components/Layout";
import "../components/topBar.css";
import "../components/tipTapEditor.css";

const allowedPriorities = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3", "D", "E"];

const Dashboard = () => {
  const [columns, setColumns] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("A1");
  const [userId, setUserId] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(null);
  const [isTaskDropdownOpen, setIsTaskDropdownOpen] = useState(null);
  const [newBoardName, setNewBoardName] = useState("");
  const [editingColumnId, setEditingColumnId] = useState(null);
  const [isTaskHovered, setIsTaskHovered] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskDescription, setTaskDescription] = useState("");
  const dropdownRef = useRef(null);
  const [dueDate, setDueDate] = useState(null);
  const [isAddingBoard, setIsAddingBoard] = useState(false);
  const [renamingColumnId, setRenamingColumnId] = useState(null);
  const [newBoardCreateName, setNewBoardCreateName] = useState("");
  const [user, setUser] = useState(null);
  const [assignedTo, setAssignedTo] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserId(user.uid);
      setUser(user);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        const [tasksRes, columnOrderRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/tasks/${userId}`),
          axios.get(`http://localhost:5000/api/tasks/columns/order/${userId}`),
        ]);

        const groupedTasks = {};

        const savedColumnOrder = columnOrderRes.data.columnOrder;
        const savedColumnNames = columnOrderRes.data.columnNames || {};

        savedColumnOrder.forEach((columnId) => {
          groupedTasks[columnId] = {
            name: savedColumnNames[columnId] || columnId,
            items: [],
          };
        });

        tasksRes.data.forEach((task) => {
          if (groupedTasks[task.status]) {
            groupedTasks[task.status].items.push(task);
          }
        });

        setColumns(groupedTasks);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(null);
        setIsTaskDropdownOpen(null);
        setIsTaskHovered(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDragEnd = async (result) => {
    const { source, destination, type } = result;

    if (!destination) return;

    if (type === "COLUMN") {
      const newColumnOrder = Object.keys(columns);
      const [movedColumn] = newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, movedColumn);

      const newColumns = {};
      newColumnOrder.forEach((columnId) => {
        newColumns[columnId] = columns[columnId];
      });

      setColumns(newColumns);

      try {
        await axios.put("http://localhost:5000/api/tasks/columns/order", {
          userId,
          columnOrder: newColumnOrder,
        });
      } catch (error) {
        console.error("Error saving column order:", error);
      }

      return;
    }

    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];

    const sourceItems = [...sourceColumn.items];
    const destItems = sourceColumn === destColumn ? sourceItems : [...destColumn.items];

    const [movedItem] = sourceItems.splice(source.index, 1);
    movedItem.status = destination.droppableId;
    destItems.splice(destination.index, 0, movedItem);

    const updatedTasks = destItems.map((task, index) => ({
      ...task,
      order: index,
    }));

    const updatedColumns = {
      ...columns,
      [source.droppableId]: { ...sourceColumn, items: sourceItems },
      [destination.droppableId]: { ...destColumn, items: updatedTasks },
    };

    setColumns(updatedColumns);

    try {
      await axios.put("http://localhost:5000/api/tasks/reorder", {
        tasks: updatedTasks,
      });
    } catch (error) {
      console.error("Error updating task order:", error);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    // Set the selectedStatus to the first column ID (or any valid column ID)
    const firstColumnId = Object.keys(columns)[0];
    setSelectedStatus(firstColumnId);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewTaskTitle("");
    setTaskDescription("");
    setAssignedTo("");
    setSelectedPriority("A1");
    setDueDate(null);
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !userId) return;

    try {
      const res = await axios.post("http://localhost:5000/api/tasks", {
        title: newTaskTitle,
        priority: selectedPriority,
        status: selectedStatus, // Ensure this is being passed correctly
        userId: userId,
        description: taskDescription,
        assignedTo: assignedTo,
      });

      const newTask = res.data;

      setColumns((prevColumns) => {
        const targetColumn = prevColumns[selectedStatus] || { name: selectedStatus, items: [] };
        return {
          ...prevColumns,
          [selectedStatus]: { ...targetColumn, items: [...targetColumn.items, newTask] },
        };
      });

      setNewTaskTitle("");
      setTaskDescription("");
      setAssignedTo("");
      closeModal();
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const createBoard = async (boardName) => {
    if (!boardName.trim()) return;

    try {
      const res = await axios.post("http://localhost:5000/api/tasks/columns/create", {
        userId,
        columnName: boardName,
      });

      const { columnId, columnName } = res.data;

      setColumns((prevColumns) => ({
        ...prevColumns,
        [columnId]: { name: columnName, items: [] }, // Ensure items array is initialized
      }));

      setNewBoardCreateName("");
      setIsAddingBoard(false);
      setIsDropdownOpen(null);
    } catch (error) {
      console.error("Error creating board:", error);
    }
  };

  const renameBoard = async (columnId, newName) => {
    if (!newName.trim()) return;

    try {
      await axios.put("http://localhost:5000/api/tasks/columns/rename", {
        userId,
        columnId,
        newName,
      });

      setColumns((prevColumns) => ({
        ...prevColumns,
        [columnId]: { ...prevColumns[columnId], name: newName },
      }));

      setNewBoardName("");
      setRenamingColumnId(null);
      setIsDropdownOpen(null);
    } catch (error) {
      console.error("Error renaming board:", error);
    }
  };

  const deleteBoard = async (columnId) => {
    try {
      await axios.delete("http://localhost:5000/api/tasks/columns/delete", {
        data: { userId, columnId },
      });

      setColumns((prevColumns) => {
        const newColumns = { ...prevColumns };
        delete newColumns[columnId];
        return newColumns;
      });

      setIsDropdownOpen(null);
    } catch (error) {
      console.error("Error deleting board:", error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`);

      setColumns((prevColumns) => {
        const newColumns = { ...prevColumns };
        Object.keys(newColumns).forEach((columnId) => {
          newColumns[columnId].items = newColumns[columnId].items.filter((task) => task._id !== taskId);
        });
        return newColumns;
      });

      setIsTaskDropdownOpen(null);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  return (
    <Layout openModal={openModal}>
      <h1>📌 Dashboard</h1>
      <br></br>
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
                  <Draggable key={columnId} draggableId={columnId} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="kanban-column"
                      >
                        <div className="column-header" {...provided.dragHandleProps}>
                          {renamingColumnId === columnId ? (
                            <div className="rename-board-wrapper">
                              <input
                                type="text"
                                value={newBoardName}
                                onChange={(e) => setNewBoardName(e.target.value)}
                                autoFocus
                              />
                              <div className="button-container">
                                <button className="tick-btn" onClick={() => renameBoard(columnId, newBoardName)}>
                                  ✔️
                                </button>
                                <button className="cross-btn" onClick={() => setRenamingColumnId(null)}>
                                  ❌
                                </button>
                              </div>
                            </div>
                          ) : (
                            <h2>{columns[columnId].name}</h2>
                          )}
                          <div className="column-actions">
                            <button
                              className={`dots-button ${isDropdownOpen === columnId ? "active" : ""}`}
                              onClick={() => setIsDropdownOpen(isDropdownOpen === columnId ? null : columnId)}
                            >
                              &#8942;
                            </button>
                            {isDropdownOpen === columnId && (
                              <div className={`dropdown-menu ${isDropdownOpen === columnId ? "open" : ""}`} ref={dropdownRef}>
                                <button onClick={() => deleteBoard(columnId)}>Delete</button>
                                <button
                                  onClick={() => {
                                    setRenamingColumnId(columnId);
                                    setNewBoardName(columns[columnId].name);
                                    setIsDropdownOpen(null);
                                  }}
                                >
                                  Rename
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <Droppable droppableId={columnId} type="TASK">
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="droppable-area"
                            >
                              {columns[columnId].items.map((task, index) => (
                                <Draggable key={task._id} draggableId={task._id} index={index}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className="task-card"
                                      onMouseEnter={() => setIsTaskHovered(task._id)}
                                      onMouseLeave={() => {
                                        if (isTaskDropdownOpen !== task._id) {
                                          setIsTaskHovered(null);
                                        }
                                      }}
                                    >
                                      <span>{task.title}</span>
                                      <div className="task-bottom">
                                        <b className={`priority-${task.priority.replace(/\s+/g, "")}`}>
                                          {task.priority}
                                        </b>
                                        <div className="task-actions">
                                          <button
                                            className={`dots-button ${isTaskHovered === task._id || isTaskDropdownOpen === task._id ? "visible" : ""}`}
                                            onClick={() => setIsTaskDropdownOpen(isTaskDropdownOpen === task._id ? null : task._id)}
                                          >
                                            &#8942;
                                          </button>
                                          {isTaskDropdownOpen === task._id && (
                                            <div className={`dropdown-menu ${isTaskDropdownOpen === task._id ? "open" : ""}`} ref={dropdownRef}>
                                              <button onClick={() => deleteTask(task._id)}>Delete</button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                <div className="add-task-container">
                  {isAddingBoard ? (
                    <div className="add-board-wrapper">
                      <input
                        type="text"
                        placeholder="Enter board name"
                        value={newBoardCreateName}
                        onChange={(e) => setNewBoardCreateName(e.target.value)}
                        autoFocus
                      />
                      <div className="button-container">
                        <button
                          className="tick-btn"
                          onClick={() => {
                            createBoard(newBoardCreateName);
                            setNewBoardCreateName("");
                          }}
                        >
                          ✔️
                        </button>
                        <button
                          className="cross-btn"
                          onClick={() => {
                            setIsAddingBoard(false);
                            setNewBoardCreateName("");
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
                      }}
                    >
                      <span className="thick-plus">+</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button className="close-modal" onClick={closeModal}>&times;</button>
              <h2>Create New Task</h2>
              <div className="modal-body">
                <div className="modal-left">
                  <label>Task Title:</label>
                  <textarea
                    className="task-title"
                    placeholder="Enter Task Title"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                  />
                  <label>Letter:</label>
                  <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)}>
                    {allowedPriorities.map(priority => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                  <label>Status:</label>
                  <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                    {Object.keys(columns).map(columnId => (
                      <option key={columnId} value={columnId}>{columns[columnId].name}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-right">
                  <label>Due Date:</label>
                  <div className="date-picker-container">
                    <DatePicker
                      selected={dueDate}
                      onChange={(date) => setDueDate(date)}
                      showTimeSelect
                      dateFormat="MMMM d, yyyy h:mm aa"
                      className="custom-date-picker"
                      placeholderText="Select due date"
                    />
                  </div>
                  <label>Assign To:</label>
                  <input
                    type="text"
                    placeholder="Assign to..."
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                  />
                  <label>Story Points:</label>
                  <div className="story-points-container">
                    <input type="number" min="0" placeholder="0" />
                  </div>
                </div>
              </div>
              <div className="description-section">
                <label>Description:</label>
                <TiptapEditor
                  value={taskDescription}
                  onChange={setTaskDescription}
                />
              </div>
              <div className="modal-footer">
                <button className="create-task-btn" onClick={handleCreateTask}>Create</button>
                <button className="cancel-btn" onClick={closeModal}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;