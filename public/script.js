const taskInput = document.getElementById("taskInput");
const addTaskButton = document.getElementById("addTaskButton");
const taskList = document.getElementById("taskList");
const searchInput = document.getElementById("searchInput");
const prioritySelect = document.getElementById("priority");
const deadlineInput = document.getElementById("deadlineInput");

// Fetch tasks from the server on load
fetchTasks();

// Function to fetch tasks
function fetchTasks() {
  fetch("http://localhost:2004/tasks")
    .then((response) => response.json())
    .then((tasks) => {
      taskList.innerHTML = ""; // clear existing tasks
      tasks.forEach((task) => {
        addTaskToDOM(task);
      });
    })
    .catch((err) => console.log(err));
}

// Function to add a task to the DOM
function addTaskToDOM(task) {
  const li = document.createElement("li");
  const taskDeadline = new Date(task.deadline + "T00:00:00");
  li.textContent = `${task.text} - Priority: ${task.priority} -  Deadline: ${
    task.deadline ? taskDeadline.toISOString().split("T")[0] : "None"
  }`;
  li.setAttribute("data-id", task.id); // Set data-id attribute for easy access

  // Apply Priority-baes classes
  applyPriorityAndDeadlineStyle(li, task);

  //   Check if the task is overdue : not done
  const currentDate = new Date().toISOString().split("T")[0];
  if (task.deadline && task.deadline < new Date()) {
    li.classList.add("overdue");
  }

  // Add a checkbox to toggle completion
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.completed || false;
  checkbox.addEventListener("change", () =>
    updateTaskCompletion(task.id, checkbox.checked)
  );

  li.appendChild(checkbox);
  if (task.completed) {
    li.classList.add("completed");
  }

  // Add Edit Button in addTaskToDOM
  const editButton = document.createElement("button");
  editButton.textContent = "Edit";
  //   editButton.classList.add("editButton");
  editButton.addEventListener("click", () =>
    editTask(task.id, task.text, task.priority, task.deadline)
  ); // , task.completed
  li.appendChild(editButton);

  // Add delete button
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", () => deleteTask(task.id));
  li.appendChild(deleteButton);
  taskList.appendChild(li);
}

function applyPriorityAndDeadlineStyle(li, task) {
  if (task.priority === "high") {
    li.classList.add("high-priority");
  } else if (task.priority === "medium") {
    li.classList.add("medium-priority");
  } else if (task.priority === "low") {
    li.classList.add("low-priority");
  }

  // Apply deadline-based classes
  const currentDate = new Date();
  const taskDeadline = new Date(task.deadline + "T00:00:00");

  if (task.deadline && taskDeadline < currentDate && !task.completed) {
    li.classList.add("overdue");
  }
}

// Add task to the server
addTaskButton.addEventListener("click", () => {
  const taskText = taskInput.value;
  const priority = prioritySelect.value;
  const deadline = deadlineInput.value;

  const task = {
    text: taskText,
    priority: priority,
    deadline: deadline || null,
  };

  fetch("http://localhost:2004/task", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  })
    .then((response) => response.json())
    .then((createdTask) => {
      console.log("Created Task:", createdTask);
      addTaskToDOM(createdTask);
      taskInput.value = "";
      deadlineInput.value = "";
    })
    .catch((err) => console.log("Error:",err));
});

// Function to update task completion status
function updateTaskCompletion(taskId, isCompleted) {
  fetch(`http://localhost:2004/tasks/${taskId}/completion`, { 
    // Correct endpoint
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ completed: isCompleted }), // Ensure completed status is sent
  })

    .then(() => {
      const taskElement = document.querySelector(`li[data-id="${taskId}"]`);
      if (isCompleted) {
        taskElement.classList.add("completed");
      } else {
        taskElement.classList.remove("completed");
      }
    })
    .catch((err) => console.log(err));
}

// Delete task function
function deleteTask(taskId) {
  fetch(`http://localhost:2004/tasks/${taskId}`, {
    method: "DELETE",
  })
    .then(() => {
      const taskItem = taskList.querySelector(`li[data-id='${taskId}']`);
      taskItem.remove();
    })
    .catch((err) => console.error(err));
}


// Edit task function (In-line editing)
function editTask(taskId, taskText, taskPriority, taskDeadline) {
  const taskElement = document.querySelector(`li[data-id="${taskId}"]`);

  // clear current content to add input fields
  taskElement.innerHTML = '';

  // Clear input for task text
  const textInput = document.createElement("input");
  textInput.type = "text";
  textInput.value = taskText;
  taskElement.appendChild(textInput);

  // Create input for task priority
  const prioritySelect = document.createElement("select");
  const priorities = ['high','medium', 'low'];
  priorities.forEach((priority) => {
    const option = document.createElement("option");
    option.value = priority;
    option.textContent = priority.charAt(0).toUpperCase() + priority.slice(1);
    if(priority === taskPriority){
      option.selected = true;
    }
    prioritySelect.appendChild(option);
  });
  taskElement.appendChild(prioritySelect);

  // Create input for task deadline
  const deadlineInput = document.createElement("input");
  deadlineInput.type = "date";
  deadlineInput.value = taskDeadline || '';
  taskElement.appendChild(deadlineInput);

  // Add save button
  const saveButton = document.createElement("button");
  saveButton.textContent = "Save";
  saveButton.addEventListener("click", () => saveTaskEdit(taskId, textInput.value, prioritySelect.value, deadlineInput.value));
  taskElement.appendChild(saveButton);

  // Add Cancel button
  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";
  cancelButton.addEventListener("click", () => fetchTasks()); // Refresh the task list
  taskElement.appendChild(cancelButton);
}

// Save edited task function
function saveTaskEdit(taskId, newTaskText, newTaskPriority, newTaskDeadline){
  const updatedTask = {
    text: newTaskText,
    priority: newTaskPriority,
    deadline: newTaskDeadline || null,
  };

  fetch(`http://localhost:2004/tasks/${taskId}`,{
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedTask),
  })
  .then(() => {
    fetchTasks();
  })
  .catch((err) => console.log(err));
}


// Search functionality
searchInput.addEventListener("input", () => {
  const searchTerm = searchInput.value.toLowerCase();
  document.querySelectorAll("#taskList li").forEach((taskItem) => {
    const taskText = taskItem.textContent.toLowerCase();
    taskItem.style.display = taskText.includes(searchTerm) ? "" : "none";
  });
});
