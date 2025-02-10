import { useEffect, useState } from "react";
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
  
        const groupedTasks = {
          backlog: { name: "Backlog", items: [] },
          todo: { name: "Todo", items: [] },
          done: { name: "Done", items: [] },
        };
  
        tasksRes.data.forEach((task) => {
          groupedTasks[task.status]?.items.push(task);
        });
  
        // ✅ Apply the saved column order
        const savedColumnOrder = columnOrderRes.data.columnOrder;
        const orderedColumns = {};
        savedColumnOrder.forEach((columnId) => {
          orderedColumns[columnId] = groupedTasks[columnId];
        });
  
        setColumns(orderedColumns);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
  
    fetchData();
  }, [userId]);

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
    movedItem.status = destination.droppableId;
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
                      <h2 {...provided.dragHandleProps}>{columns[columnId].name}</h2>
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
                                  >
                                    <span>{task.title}</span>
                                    <div className="task-bottom">
                                      <b className={`priority-${task.priority.replace(/\s+/g, "")}`}>
                                        {task.priority}
                                      </b>
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