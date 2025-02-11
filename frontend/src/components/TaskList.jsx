import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { auth } from "../firebase";
import "./styles.css";

const initialColumns = {
  backlog: { name: "Backlog", items: [] },
  todo: { name: "Todo", items: [] },
  done: { name: "Done", items: [] },
};

const allowedPriorities = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3", "D", "E"];

const TaskList = () => {
  const [columns, setColumns] = useState(initialColumns);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("A1");
  const [userId, setUserId] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(null); // Track which column's dropdown is open
  const [isTaskDropdownOpen, setIsTaskDropdownOpen] = useState(null); // Track which task's dropdown is open
  const [newBoardName, setNewBoardName] = useState(""); // For creating/renaming boards
  const [editingColumnId, setEditingColumnId] = useState(null); // Track which column is being edited
  const [isTaskHovered, setIsTaskHovered] = useState(null); // Track which task is hovered
  // Ref to track the dropdown menu
  const dropdownRef = useRef(null);

  // ✅ Fetch the current Firebase user
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserId(user.uid);
    }
  }, []);

  // ✅ Fetch Tasks when userId is available
  useEffect(() => {
    if (!userId) return;

    // ✅ Fetch tasks and column order
    const fetchData = async () => {
      try {
        const [tasksRes, columnOrderRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/tasks/${userId}`),
          axios.get(`http://localhost:5000/api/tasks/columns/order/${userId}`),
        ]);

        // Initialize an empty object to group tasks by status
        const groupedTasks = {};

        // Add default columns (backlog, todo, done) with empty items
        const defaultColumns = {
          backlog: { name: "Backlog", items: [] },
          todo: { name: "Todo", items: [] },
          done: { name: "Done", items: [] },
        };

        // Merge default columns with any custom columns from columnOrderRes
        const savedColumnOrder = columnOrderRes.data.columnOrder;
        const savedColumnNames = columnOrderRes.data.columnNames || {};

        savedColumnOrder.forEach((columnId) => {
          groupedTasks[columnId] = {
            name: savedColumnNames[columnId] || columnId, // Use saved name or fallback to columnId
            items: [], // Initialize with empty items
          };
        });

        // Group tasks by status
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
        setIsDropdownOpen(null); // Close column dropdown
        setIsTaskDropdownOpen(null); // Close task dropdown
        setIsTaskHovered(null); // Hide dots
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

    // ✅ Handle Column Dragging
    if (type === "COLUMN") {
      const newColumnOrder = Object.keys(columns);
      const [movedColumn] = newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, movedColumn);

      const newColumns = {};
      newColumnOrder.forEach((columnId) => {
        newColumns[columnId] = columns[columnId];
      });

      setColumns(newColumns);

      // ✅ Save the new column order to the backend
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

    // ✅ Handle Task Dragging
    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];

    const sourceItems = [...sourceColumn.items];
    const destItems = sourceColumn === destColumn ? sourceItems : [...destColumn.items];

    const [movedItem] = sourceItems.splice(source.index, 1);
    movedItem.status = destination.droppableId; // Update the task's status to the new board's ID
    destItems.splice(destination.index, 0, movedItem);

    // ✅ Assign correct order to tasks
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

  const addTask = async () => {
    if (!newTaskTitle.trim() || !userId) return;

    try {
      const res = await axios.post("http://localhost:5000/api/tasks", {
        title: newTaskTitle,
        priority: selectedPriority,
        status: "backlog",
        userId: userId,
      });

      const newTask = res.data;

      setColumns((prevColumns) => ({
        ...prevColumns,
        backlog: { ...prevColumns.backlog, items: [...prevColumns.backlog.items, newTask] },
      }));

      setNewTaskTitle(""); // Reset input
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const createBoard = async () => {
    if (!newBoardName.trim()) return;

    try {
      const res = await axios.post("http://localhost:5000/api/tasks/columns/create", {
        userId,
        columnName: newBoardName,
      });

      const { columnId, columnName } = res.data;

      // Add the new column to the columns state
      setColumns((prevColumns) => ({
        ...prevColumns,
        [columnId]: { name: columnName, items: [] },
      }));

      // Reset input and close dropdown
      setNewBoardName("");
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

      // Update the column name in the columns state
      setColumns((prevColumns) => ({
        ...prevColumns,
        [columnId]: { ...prevColumns[columnId], name: newName },
      }));

      // Reset input and close dropdown
      setNewBoardName("");
      setIsDropdownOpen(null);
      setEditingColumnId(null); // Reset editing state
    } catch (error) {
      console.error("Error renaming board:", error);
    }
  };

  const deleteBoard = async (columnId) => {
    try {
      await axios.delete("http://localhost:5000/api/tasks/columns/delete", {
        data: { userId, columnId },
      });

      // Remove the column from the columns state
      setColumns((prevColumns) => {
        const newColumns = { ...prevColumns };
        delete newColumns[columnId];
        return newColumns;
      });

      setIsDropdownOpen(null); // Close dropdown
    } catch (error) {
      console.error("Error deleting board:", error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`);

      // Remove the task from the columns state
      setColumns((prevColumns) => {
        const newColumns = { ...prevColumns };
        Object.keys(newColumns).forEach((columnId) => {
          newColumns[columnId].items = newColumns[columnId].items.filter((task) => task._id !== taskId);
        });
        return newColumns;
      });

      setIsTaskDropdownOpen(null); // Close dropdown
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  return (
    <div className="kanban-container">
      <div className="task-input-container">
        <input
          type="text"
          placeholder="Enter task name"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="task-input"
        />

        <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)}>
          {allowedPriorities.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>

        <button onClick={addTask} className="add-task-btn">
          + Add Task
        </button>
      </div>

      <div className="board-actions">
        <input
          type="text"
          placeholder="Enter board name"
          value={newBoardName}
          onChange={(e) => setNewBoardName(e.target.value)}
        />
        <button
          onClick={() => (editingColumnId ? renameBoard(editingColumnId, newBoardName) : createBoard())}
        >
          {editingColumnId ? "Rename Board" : "Create Board"}
        </button>
      </div>

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
                      <div
                        className="column-header"
                        {...provided.dragHandleProps}
                      >
                        <h2>{columns[columnId].name}</h2>
                        <div className="column-actions">
                          <button
                            className={`dots-button ${isDropdownOpen === columnId ? "active" : ""}`}
                            onClick={() => setIsDropdownOpen(isDropdownOpen === columnId ? null : columnId)}
                          >
                            &#8942; {/* Three dots icon */}
                          </button>
                          {isDropdownOpen === columnId && (
                            <div className={`dropdown-menu ${isDropdownOpen === columnId ? "open" : ""}`} ref={dropdownRef}>
                              <button onClick={() => deleteBoard(columnId)}>Delete</button>
                              <button
                                onClick={() => {
                                  setEditingColumnId(columnId);
                                  setNewBoardName(columns[columnId].name);
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
      onMouseEnter={() => setIsTaskHovered(task._id)} // Show dots on hover
      onMouseLeave={() => {
        if (isTaskDropdownOpen !== task._id) {
          setIsTaskHovered(null); // Hide dots on leave (unless dropdown is open)
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
            className={`dots-button ${isTaskHovered === task._id || isTaskDropdownOpen === task._id ? "visible" : ""}`} // Show dots on hover or when dropdown is open
            onClick={() => setIsTaskDropdownOpen(isTaskDropdownOpen === task._id ? null : task._id)} // Toggle dropdown on click
          >
            &#8942; {/* Three dots icon */}
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
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};


export default TaskList;