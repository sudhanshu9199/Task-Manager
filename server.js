const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 2004;

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Simple in-memory task storage
let tasks = [];
let taskIdCounter = 1; // Initial value for the task ID counter

// Load tasks from file on server startup
function loadTasks(){
  if(fs.existsSync('tasks.json')){
    tasks = JSON.parse(fs.readFileSync('tasks.json'));
    // Adjust the taskIdCounter based on the loaded tasks
    taskIdCounter = tasks.length > 0 ? tasks[tasks.length - 1].id + 1 : 1;
  }
}

// Save tasks to a file
function saveTasks() {
  console.log("Saving tasks to file:", tasks);
  fs.writeFileSync('tasks.json', JSON.stringify(tasks, null, 2));
}

// Call loadTasks at the start of the server
loadTasks();

// Get all tasks
app.get("/tasks", (req, res) => {
  res.json(tasks);
});

// Create a new task (merged into one route)
app.post("/task", (req, res) => {
  console.log("Creating task with data:", req.body);
  const newTask = {
    // id: tasks.length + 1,
    id: taskIdCounter++,
    text: req.body.text,
    priority: req.body.priority || "low", // Merged priority feature
    deadline: req.body.deadline || null,  // <-- Check if the deadline is passed properly
    completed: false, // Default completion status
  };
  tasks.push(newTask);
  saveTasks(); // Save after adding task
  console.log("New task saved:", newTask);
  res.status(201).json(newTask);
});

// Delete a task
app.delete("/tasks/:id", (req, res) => {
  const taskId = parseInt(req.params.id);
  tasks = tasks.filter(task => task.id !== taskId);
  saveTasks(); // Save after deleting task
  res.status(204).send();
});

// Update a task's text
app.put("/tasks/:id", (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const taskIndex = tasks.findIndex(task => task.id === taskId);
  if (taskIndex !== -1) {
    tasks[taskIndex].text = req.body.text;
    tasks[taskIndex].priority = req.body.priority || tasks[taskIndex].priority;
    tasks[taskIndex].deadline = req.body.deadline || tasks[taskIndex].deadline;
    saveTasks(); // Ensure the tasks are saved after updating
    res.status(200).json(tasks[taskIndex]);
  } else {
    res.status(404).send("Task not found");
  }
});


// Modify (update) task structure to have a completed status
app.put("/tasks/:id/completion", (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const taskIndex = tasks.findIndex(task => task.id === taskId);
  if (taskIndex !== -1) {
    tasks[taskIndex].completed = req.body.completed;
    saveTasks();
    res.status(200).json(tasks[taskIndex]);
  } else {
    res.status(404).send("Task not found");
  }
});


// Search for tasks
app.get("/tasks/search", (req, res) => {
  const query = req.query.q.toLowerCase();
  const filteredTasks = tasks.filter(task => task.text.toLowerCase().includes(query));
  res.json(filteredTasks);
});


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"), (err) => {
    if (err) {
      console.error("Error sending index.html:", err);
      res.status(err.status).end();
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});