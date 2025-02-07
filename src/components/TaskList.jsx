import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../firebase";

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("A");
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      axios.get(`http://localhost:5000/api/tasks/${user.uid}`)
        .then(res => setTasks(res.data))
        .catch(err => console.error(err));
    }
  }, [user]);

  const addTask = async () => {
    if (!title.trim()) return;
    try {
      const res = await axios.post("http://localhost:5000/api/tasks", { 
        title, 
        priority, 
        userId: user.uid 
      });
      setTasks([...tasks, res.data]);
      setTitle("");
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${id}`);
      setTasks(tasks.filter(task => task._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Your Tasks</h2>
      <div className="flex gap-2 mb-4">
        <input 
          className="border p-2 w-full" 
          placeholder="Task Name" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
        />
        <select className="border p-2" value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="A">A - Very Important</option>
          <option value="B">B - Important</option>
          <option value="C">C - Nice to Do</option>
          <option value="D">D - Delegate</option>
          <option value="E">E - Eliminate</option>
        </select>
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={addTask}>
          Add
        </button>
      </div>
      <ul>
        {tasks.map(task => (
          <li key={task._id} className="flex justify-between p-2 border-b">
            <span>{task.title} ({task.priority})</span>
            <button onClick={() => deleteTask(task._id)} className="text-red-500">X</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskList;
