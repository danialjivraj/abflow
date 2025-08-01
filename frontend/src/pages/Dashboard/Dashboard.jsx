import { useEffect, useState, useRef } from "react";
import Layout from "../../components/navigation/Layout";
import TopBar from "../../components/navigation/TopBar";
import LabelsModal from "../../components/modals/LabelsModal.jsx";
import { getDashboardTopBarConfig } from "../../config/topBarConfig.jsx";
import CreateTaskModal from "../../components/modals/CreateTaskModal.jsx";
import ViewTaskModal from "../../components/modals/ViewTaskModal.jsx";
import ScheduleEditModal from "../../components/modals/ScheduleEditModal.jsx";
import { auth } from "../../firebase";
import { useNavigate, useLocation } from "react-router-dom";
import {
  fetchTasks,
  createTask,
  updateTask,
  completeTask,
  deleteTaskAPI,
  startTimerAPI,
  stopTimerAPI,
  reorderTasks,
} from "../../services/tasksService";
import {
  fetchColumnOrder,
  createBoard,
  saveColumnOrder,
} from "../../services/columnsService";
import { formatDueDate } from "../../utils/dateUtils";
import BoardsView from "./BoardsView";
import CompletedTasks from "./CompletedTasks";
import ScheduleView from "./ScheduleView";
import "../../components/styles.css";
import "../../components/navigation/topBar.css";
import "../../components/tipTapEditor.css";
import { validateColumnName } from "../../utils/boardValidation";
import { fetchSettingsPreferences } from "../../services/preferencesService";
import { fetchLabels } from "../../services/labelsService";
import { toast } from "react-toastify";

export const getBaseRoute = (pathname) => {
  const parts = pathname.split("/");
  const validRoutes = ["boards", "completedtasks", "schedule"];
  if (parts.length > 2 && validRoutes.includes(parts[2])) {
    return `/dashboard/${parts[2]}`;
  }
  return "/dashboard/boards";
};

const Dashboard = (props) => {
  // state and refs
  const [columns, setColumns] = useState({});
  const [columnsLoaded, setColumnsLoaded] = useState(false);
  const [userId, setUserId] = useState(null);
  const [renamingColumnId, setRenamingColumnId] = useState(null);
  const [newBoardName, setNewBoardName] = useState("");
  const [isAddingBoard, setIsAddingBoard] = useState(false);
  const [newBoardCreateName, setNewBoardCreateName] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(null);
  const [isTaskDropdownOpen, setIsTaskDropdownOpen] = useState(null);
  const [isTaskHovered, setIsTaskHovered] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const dropdownRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("A1");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [dueDate, setDueDate] = useState(null);
  const [assignedTo, setAssignedTo] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [storyPoints, setStoryPoints] = useState(0);
  const [dueDateWarning, setDueDateWarning] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [scheduledStartShortcut, setScheduledStartShortcut] = useState(null);
  const [scheduledEndShortcut, setScheduledEndShortcut] = useState(null);
  const [selectedScheduleEvent, setSelectedScheduleEvent] = useState(null);
  const [createBoardError, setCreateBoardError] = useState("");
  const [renameBoardError, setRenameBoardError] = useState("");
  const [labels, setLabels] = useState([]);
  const [newTaskLabels, setNewTaskLabels] = useState([]);

  const { userSettings, setUserSettings } = props;
  const navigate = useNavigate();
  const location = useLocation();

  const baseRoute = getBaseRoute(location.pathname);
  const isCreateTaskModalOpen = location.pathname === `${baseRoute}/createtask`;
  const isLabelsModalOpen = location.pathname === `${baseRoute}/labels`;
  const isViewTaskModalOpen =
    location.pathname.startsWith(`${baseRoute}/viewtask/`) && selectedTask;
  const isScheduleModalOpen =
    /\/dashboard\/schedule\/editevent\/[^/]+$/.test(location.pathname) &&
    selectedScheduleEvent;

  // side effects
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserId(currentUser.uid);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchSettingsPreferences(userId)
        .then((res) => {
          const prefs = res.data.settingsPreferences || {};
          setUserSettings((prev) => ({ ...prev, ...prefs }));
        })
        .catch((err) =>
          console.error("Error fetching settings preferences", err),
        );
    }
  }, [userId]);

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

        const completed = [];
        fetchedTasks.forEach((task) => {
          if (task.status === "completed") {
            completed.push({
              ...task,
              isTimerRunning: task.isTimerRunning || false,
              timerStartTime: task.timerStartTime || null,
            });
          } else if (groupedTasks[task.status]) {
            groupedTasks[task.status].items.push({
              ...task,
              isTimerRunning: task.isTimerRunning || false,
              timerStartTime: task.timerStartTime || null,
            });
          }
        });

        setColumns(groupedTasks);
        setCompletedTasks(completed);
        if (columnOrder.length > 0 && !selectedStatus) {
          setSelectedStatus(columnOrder[0]);
        }
        setColumnsLoaded(true);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, [userId, selectedStatus]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const match = location.pathname.match(/\/viewtask\/([^/]+)/);
    if (match) {
      const tId = match[1];
      let foundTask = null;
      if (location.pathname.includes("/dashboard/completedtasks")) {
        foundTask = completedTasks.find((t) => t._id === tId);
      } else {
        Object.values(columns).forEach((column) => {
          const task = column.items.find((t) => t._id === tId);
          if (task) foundTask = task;
        });
      }
      setSelectedTask(foundTask);
    } else {
      setSelectedTask(null);
    }
  }, [location, columns, completedTasks]);

  useEffect(() => {
    const match = location.pathname.match(
      /\/dashboard\/schedule\/editevent\/([^/]+)/,
    );
    if (match) {
      const eventId = match[1];
      const allTasks = Object.values(columns).flatMap((col) => col.items);
      const foundTask = allTasks.find((task) => task._id === eventId);
      if (foundTask) {
        const eventData = {
          id: foundTask._id,
          title: foundTask.title,
          start: foundTask.scheduledStart
            ? new Date(foundTask.scheduledStart)
            : new Date(),
          end: foundTask.scheduledEnd
            ? new Date(foundTask.scheduledEnd)
            : new Date(new Date().getTime() + 60 * 60 * 1000),
          priority: foundTask.priority,
          task: foundTask,
          isUnscheduled: !foundTask.scheduledStart,
        };
        setSelectedScheduleEvent(eventData);
      } else {
        setSelectedScheduleEvent(null);
      }
    } else {
      setSelectedScheduleEvent(null);
    }
  }, [location, columns]);

  useEffect(() => {
    if (userId) {
      fetchLabels(userId)
        .then((res) => setLabels(res.data))
        .catch((err) => console.error("Error fetching labels:", err));
    }
  }, [userId]);

  const updateTaskInState = (updatedTask) => {
    setColumns((prevColumns) => {
      const newColumns = { ...prevColumns };
      Object.keys(newColumns).forEach((colId) => {
        newColumns[colId].items = newColumns[colId].items.map((task) =>
          task._id === updatedTask._id ? updatedTask : task,
        );
      });
      return newColumns;
    });
  };

  // handlers for modal navigation
  const openCreateModal = () => {
    navigate(`${baseRoute}/createtask`);
  };

  const openLabelsModalRoute = () => {
    navigate(`${baseRoute}/labels`);
  };

  const closeModal = () => {
    resetForm();
    navigate(baseRoute);
  };

  const openViewTaskModal = (task) => {
    setSelectedTask(task);
    navigate(`${baseRoute}/viewtask/${task._id}`);
  };

  const closeViewTaskModal = () => {
    setSelectedTask(null);
    navigate(baseRoute);
  };

  const closeScheduleModal = () => {
    setSelectedScheduleEvent(null);
    navigate("/dashboard/schedule");
  };

  const handleScheduleModalSave = (updatedEvent) => {
    const updatedTask = {
      ...updatedEvent.task,
      scheduledStart: updatedEvent.start.toISOString(),
      scheduledEnd: updatedEvent.end.toISOString(),
    };
    updateTask(updatedTask)
      .then((response) => {
        updateTaskInState(response.data);
      })
      .catch((err) => console.error("Error updating scheduled task:", err));
    closeScheduleModal();
  };

  const handleScheduleModalUnschedule = (event) => {
    const updatedTask = {
      ...event.task,
      scheduledStart: null,
      scheduledEnd: null,
    };
    updateTask(updatedTask)
      .then((response) => {
        updateTaskInState(response.data);
      })
      .catch((err) => console.error("Error unscheduling task:", err));
    closeScheduleModal();
  };

  const handleCreateBoard = async () => {
    try {
      const res = await createBoard(userId, newBoardCreateName);
      const { columnId, columnName } = res.data;
      setColumns((prev) => ({
        ...prev,
        [columnId]: { name: columnName, items: [] },
      }));
      setSelectedStatus(columnId);
      setNewBoardCreateName("");
      setIsAddingBoard(false);
      setIsDropdownOpen(null);
      setCreateBoardError("");
    } catch (error) {
      console.error("Error creating board:", error);
      const backendError = error.response?.data?.error;
      const frontendError = validateColumnName(newBoardCreateName, columns);
      setCreateBoardError(
        backendError || frontendError || "Failed to create board",
      );
    }
  };

  const onBoardRename = (columnId, newName) => {
    setColumns((prev) => ({
      ...prev,
      [columnId]: { ...prev[columnId], name: newName },
    }));
  };

  const onBoardDelete = (columnId) => {
    setColumns((prev) => {
      const updated = { ...prev };
      delete updated[columnId];
      return updated;
    });
  };

  const duplicateTask = async (originalTask) => {
    try {
      const duplicateData = {
        title: originalTask.title,
        priority: originalTask.priority,
        status: originalTask.status,
        userId: originalTask.userId,
        description: originalTask.description,
        assignedTo: originalTask.assignedTo,
        dueDate: originalTask.dueDate,
        storyPoints: originalTask.storyPoints,
        scheduledStart: null,
        scheduledEnd: null,
        order: originalTask.order + 1,
        timeSpent: 0,
        isTimerRunning: false,
        timerStartTime: null,
        labels: originalTask.labels ? [...originalTask.labels] : [],
      };
      const response = await createTask(duplicateData);
      const newTask = response.data;
      setColumns((prevColumns) => {
        const column = prevColumns[originalTask.status];
        if (!column) return prevColumns;
        const originalIndex = column.items.findIndex(
          (t) => t._id === originalTask._id,
        );
        const newItems = [...column.items];
        newItems.splice(originalIndex + 1, 0, newTask);
        return {
          ...prevColumns,
          [originalTask.status]: { ...column, items: newItems },
        };
      });
      toast.success("Task duplicated!");
    } catch (error) {
      console.error("Error duplicating task:", error);
      toast.error("Failed to duplicate task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTaskAPI(taskId);
      setColumns((prevColumns) => {
        const updatedColumns = { ...prevColumns };
        Object.keys(updatedColumns).forEach((colId) => {
          updatedColumns[colId].items = updatedColumns[colId].items.filter(
            (task) => task._id !== taskId,
          );
        });
        return updatedColumns;
      });
      setCompletedTasks((prevCompleted) =>
        prevCompleted.filter((task) => task._id !== taskId),
      );
      toast.success("Task deleted!");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task!");
    }
  };

  const handleCompleteTaskFromDropdown = async (task) => {
    try {
      if (task.isTimerRunning) {
        await handleStopTimer(task._id);
      }
      const response = await completeTask(task._id);
      const updatedTask = response.data;
      handleUpdateTask(updatedTask);
    } catch (error) {
      console.error("Error completing task from dropdown:", error);
    }
  };

  const handleBackToBoardsFromDropdown = async (task) => {
    try {
      const newStatus = Object.keys(columns)[0] || "backlog";
      const boardTasks = columns[newStatus]?.items || [];
      const highestOrder = boardTasks.reduce(
        (max, t) => Math.max(max, t.order || 0),
        -1,
      );
      const newOrder = highestOrder + 1;
      const updatedTask = {
        ...task,
        status: newStatus,
        order: newOrder,
        taskCompleted: false,
        completedAt: null,
      };
      const response = await updateTask(updatedTask);
      const updatedTaskFromBackend = response.data;
      handleUpdateTask(updatedTaskFromBackend);
      toast.success("Task moved back to boards!");
    } catch (error) {
      console.error("Error moving task back to boards:", error);
      toast.error("Error moving task back to boards.");
    }
  };

  const updateTaskInColumns = (taskId, updates) => {
    setColumns((prevColumns) => {
      const updatedColumns = { ...prevColumns };
      Object.keys(updatedColumns).forEach((colId) => {
        updatedColumns[colId].items = updatedColumns[colId].items.map((task) =>
          task._id === taskId ? { ...task, ...updates } : task,
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
      setCompletedTasks((prev) =>
        prev.map((task) =>
          task._id === taskId
            ? {
                ...task,
                isTimerRunning: true,
                timerStartTime: updatedTask.timerStartTime,
              }
            : task,
        ),
      );
    } catch (error) {
      console.error("Error starting timer:", error);
    }
  };

  const handleStopTimer = async (taskId) => {
    try {
      const response = await stopTimerAPI(taskId);
      const updatedTask = response.data;
      updateTaskInColumns(taskId, {
        isTimerRunning: false,
        timerStartTime: null,
        timeSpent: updatedTask.timeSpent,
      });
      setCompletedTasks((prev) =>
        prev.map((task) =>
          task._id === taskId
            ? {
                ...task,
                isTimerRunning: false,
                timerStartTime: null,
                timeSpent: updatedTask.timeSpent,
              }
            : task,
        ),
      );
    } catch (error) {
      console.error("Error stopping timer:", error);
    }
  };

  const resetForm = () => {
    setNewTaskTitle("");
    setSelectedStatus("");
    setDueDate(null);
    setAssignedTo("");
    setTaskDescription("");
    setStoryPoints(0);
    setDueDateWarning("");
  };

  const handleCreateTask = async () => {
    if (!userId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const taskData = {
        title: newTaskTitle,
        priority: selectedPriority,
        status: selectedStatus,
        userId,
        dueDate,
        assignedTo,
        description: taskDescription,
        storyPoints,
        scheduledStart: scheduledStartShortcut
          ? scheduledStartShortcut.toISOString()
          : null,
        scheduledEnd: scheduledEndShortcut
          ? scheduledEndShortcut.toISOString()
          : null,
        labels: newTaskLabels,
      };
      const response = await createTask(taskData);
      const newTask = response.data;
      setColumns((prev) => {
        const updated = { ...prev };
        if (updated[newTask.status]) {
          if (
            !updated[newTask.status].items.find(
              (task) => task._id === newTask._id,
            )
          ) {
            updated[newTask.status].items = [
              ...updated[newTask.status].items,
              newTask,
            ];
          }
        }
        return updated;
      });
      resetForm();
      closeModal();
      setScheduledStartShortcut(null);
      setScheduledEndShortcut(null);
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTask = async (updatedTask) => {
    try {
      const response = await updateTask(updatedTask);
      const updatedTaskFromBackend = response.data;
      setColumns((prevColumns) => {
        const updatedColumns = { ...prevColumns };
        let oldCol = null;
        Object.keys(updatedColumns).forEach((colId) => {
          if (
            updatedColumns[colId].items.find(
              (t) => t._id === updatedTaskFromBackend._id,
            )
          ) {
            oldCol = colId;
          }
        });
        if (oldCol && oldCol === updatedTaskFromBackend.status) {
          updatedColumns[oldCol].items = updatedColumns[oldCol].items.map(
            (t) =>
              t._id === updatedTaskFromBackend._id ? updatedTaskFromBackend : t,
          );
        } else {
          Object.keys(updatedColumns).forEach((colId) => {
            updatedColumns[colId].items = updatedColumns[colId].items.filter(
              (t) => t._id !== updatedTaskFromBackend._id,
            );
          });
          if (updatedColumns[updatedTaskFromBackend.status]) {
            updatedColumns[updatedTaskFromBackend.status].items.push(
              updatedTaskFromBackend,
            );
          }
        }
        return updatedColumns;
      });
      setCompletedTasks((prevCompleted) => {
        if (updatedTaskFromBackend.status !== "completed") {
          return prevCompleted.filter(
            (t) => t._id !== updatedTaskFromBackend._id,
          );
        }
        const exists = prevCompleted.some(
          (t) => t._id === updatedTaskFromBackend._id,
        );
        if (exists) {
          return prevCompleted.map((t) =>
            t._id === updatedTaskFromBackend._id ? updatedTaskFromBackend : t,
          );
        } else {
          return [...prevCompleted, updatedTaskFromBackend];
        }
      });
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const openCreateTaskModal = (status) => {
    setSelectedStatus(status);
    navigate(`${baseRoute}/createtask`);
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
    const updatedTasks = destItems.map((task, idx) => ({
      ...task,
      order: idx,
    }));
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

  const renderContent = () => {
    if (location.pathname.startsWith("/dashboard/completedtasks")) {
      return (
        <CompletedTasks
          completedTasks={completedTasks}
          hideOldCompletedTasksDays={userSettings.hideOldCompletedTasksDays}
          hideOldCompletedTasksNever={userSettings.hideOldCompletedTasksNever}
          setCompletedTasks={setCompletedTasks}
          currentTime={currentTime}
          openViewTaskModal={openViewTaskModal}
          deleteTask={handleDeleteTask}
          startTimer={handleStartTimer}
          stopTimer={handleStopTimer}
          isTaskHovered={isTaskHovered}
          setIsTaskHovered={setIsTaskHovered}
          isTaskDropdownOpen={isTaskDropdownOpen}
          setIsTaskDropdownOpen={setIsTaskDropdownOpen}
          handleBackToBoards={handleBackToBoardsFromDropdown}
          userSettings={userSettings}
          newTaskLabels={newTaskLabels}
          availableLabels={labels}
          setNewTaskLabels={setNewTaskLabels}
        />
      );
    } else if (location.pathname.startsWith("/dashboard/schedule")) {
      const currentTasks = Object.values(columns).flatMap((col) => col.items);
      return (
        <ScheduleView
          tasks={currentTasks}
          updateTaskInState={updateTaskInState}
          onCreateTaskShortcut={(start, end) => {
            if (userSettings.disableToCreateTask) return;
            setScheduledStartShortcut(start);
            setScheduledEndShortcut(end);
            navigate(`${baseRoute}/createtask`);
          }}
          userSettings={userSettings}
        />
      );
    } else if (location.pathname.startsWith("/dashboard/boards")) {
      return (
        <BoardsView
          columns={columns}
          renamingColumnId={renamingColumnId}
          newBoardName={newBoardName}
          setNewBoardName={setNewBoardName}
          setRenamingColumnId={setRenamingColumnId}
          isDropdownOpen={isDropdownOpen}
          setIsDropdownOpen={setIsDropdownOpen}
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
          openViewTaskModal={openViewTaskModal}
          handleDragEnd={handleDragEnd}
          isAddingBoard={isAddingBoard}
          newBoardCreateName={newBoardCreateName}
          setNewBoardCreateName={setNewBoardCreateName}
          setIsAddingBoard={setIsAddingBoard}
          handleCreateBoard={handleCreateBoard}
          createBoardError={createBoardError}
          setCreateBoardError={setCreateBoardError}
          handleCompleteTask={handleCompleteTaskFromDropdown}
          renameBoardError={renameBoardError}
          setRenameBoardError={setRenameBoardError}
          onBoardRename={onBoardRename}
          onBoardDelete={onBoardDelete}
          confirmBeforeDeleteBoard={userSettings.confirmBeforeDeleteBoard}
          confirmBeforeDeleteTask={userSettings.confirmBeforeDeleteTask}
          openCreateTaskModal={openCreateTaskModal}
          duplicateTask={duplicateTask}
          availableLabels={labels}
          userSettings={userSettings}
        />
      );
    }
  };

  return (
    <Layout
      openModal={
        isCreateTaskModalOpen ||
        isLabelsModalOpen ||
        isViewTaskModalOpen ||
        isScheduleModalOpen
      }
    >
      <TopBar
        buttons={getDashboardTopBarConfig(
          openCreateModal,
          openLabelsModalRoute,
          navigate,
        )}
        navigate={navigate}
      />
      {renderContent()}
      <CreateTaskModal
        isModalOpen={isCreateTaskModalOpen}
        closeModal={closeModal}
        columns={columns}
        columnsLoaded={columnsLoaded}
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
        dueDateWarning={dueDateWarning}
        setDueDateWarning={setDueDateWarning}
        storyPoints={storyPoints}
        setStoryPoints={setStoryPoints}
        newBoardCreateName={newBoardCreateName}
        setNewBoardCreateName={setNewBoardCreateName}
        handleCreateBoard={handleCreateBoard}
        createBoardError={createBoardError}
        availableLabels={labels}
        newTaskLabels={newTaskLabels}
        setNewTaskLabels={setNewTaskLabels}
        userSettings={userSettings}
      />
      <LabelsModal
        isOpen={isLabelsModalOpen}
        closeModal={closeModal}
        labels={labels}
        setLabels={setLabels}
        userId={userId}
      />
      <ViewTaskModal
        isModalOpen={isViewTaskModalOpen}
        closeModal={closeViewTaskModal}
        task={selectedTask}
        handleUpdateTask={handleUpdateTask}
        columns={columns}
        startTimer={startTimerAPI}
        stopTimer={stopTimerAPI}
        setCompletedTasks={setCompletedTasks}
        newTaskLabels={newTaskLabels}
        availableLabels={labels}
        setNewTaskLabels={setNewTaskLabels}
        userSettings={userSettings}
      />
      <ScheduleEditModal
        isModalOpen={isScheduleModalOpen}
        eventData={selectedScheduleEvent}
        onSave={handleScheduleModalSave}
        onUnschedule={handleScheduleModalUnschedule}
        onClose={closeScheduleModal}
        userSettings={userSettings}
      />
    </Layout>
  );
};

export default Dashboard;
