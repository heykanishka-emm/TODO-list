console.log("Frontend-only JS loaded 💗");

const taskInput = document.getElementById("taskInput");
const categoryInput = document.getElementById("categoryInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const totalCount = document.getElementById("totalCount");
const completedCount = document.getElementById("completedCount");
const clearCompleted = document.getElementById("clearCompleted");
const clearAll = document.getElementById("clearAll");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTasks() {
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    taskList.innerHTML =
      `<li class="task"><label class="meta">No tasks yet ✨</label></li>`;
    updateCounts();
    return;
  }

  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.className = "task";

    const left = document.createElement("div");
    left.className = "left";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;

    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      saveTasks();
      renderTasks();
    });

    const label = document.createElement("label");
    label.textContent = task.text;
    if (task.done) label.classList.add("done");

    left.appendChild(checkbox);
    left.appendChild(label);

    if (task.category) {
      const badge = document.createElement("span");
      badge.className = "category-badge";
      badge.textContent = task.category;
      left.appendChild(badge);
    }

    const delBtn = document.createElement("button");
    delBtn.className = "icon-btn";
    delBtn.textContent = "🗑";
    delBtn.onclick = () => {
      tasks.splice(index, 1);
      saveTasks();
      renderTasks();
    };

    li.appendChild(left);
    li.appendChild(delBtn);
    taskList.appendChild(li);
  });

  updateCounts();
}

function updateCounts() {
  totalCount.textContent = tasks.length;
  completedCount.textContent = tasks.filter(t => t.done).length;
}

function addTask() {
  const text = taskInput.value.trim();
  const category = categoryInput.value.trim();
  if (!text) return;

  tasks.push({ text, category, done: false });
  saveTasks();
  renderTasks();

  taskInput.value = "";
  categoryInput.value = "";
}

addBtn.addEventListener("click", addTask);
taskInput.addEventListener("keydown", e => {
  if (e.key === "Enter") addTask();
});

clearCompleted.addEventListener("click", () => {
  tasks = tasks.filter(t => !t.done);
  saveTasks();
  renderTasks();
});

clearAll.addEventListener("click", () => {
  tasks = [];
  saveTasks();
  renderTasks();
});

renderTasks();
