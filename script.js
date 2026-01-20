// Client-side logic: talk to Flask API, render tasks, support reorder, edit, export/import
const api = {
  list: () => fetch("/api/tasks").then(r => r.json()),
  create: (t) => fetch("/api/tasks", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(t)}).then(r => r.json()),
  update: (id, t) => fetch(`/api/tasks/${id}`, {method:"PUT", headers:{"Content-Type":"application/json"}, body: JSON.stringify(t)}).then(r => r.json()),
  delete: (id) => fetch(`/api/tasks/${id}`, {method:"DELETE"}).then(r => r.json()),
  reorder: (order) => fetch("/api/tasks/reorder", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({order})}).then(r => r.json()),
  export: () => { window.location = "/api/export"; },
};

const taskInput = document.getElementById("taskInput");
const categoryInput = document.getElementById("categoryInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const totalCount = document.getElementById("totalCount");
const completedCount = document.getElementById("completedCount");
const clearCompleted = document.getElementById("clearCompleted");
const clearAll = document.getElementById("clearAll");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");

let tasks = [];

function load() {
  api.list().then(data => {
    tasks = data;
    renderTasks();
  });
}

function renderTasks(){
  taskList.innerHTML = "";
  if(tasks.length === 0){
    const el = document.createElement("li");
    el.className = "task";
    el.innerHTML = `<div class="left"><label class="meta">No tasks yet — add one above ✨</label></div>`;
    taskList.appendChild(el);
    renderCounts();
    return;
  }
  tasks.forEach(task => {
    const li = document.createElement("li");
    li.className = "task";
    li.dataset.id = task.id;

    const left = document.createElement("div");
    left.className = "left";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!task.done;
    cb.addEventListener("change", () => {
      api.update(task.id, {done: cb.checked}).then(updated => {
        task.done = updated.done;
        renderTasks();
      });
    });

    const label = document.createElement("label");
    label.textContent = task.text;
    if(task.done) label.classList.add("done");

    label.addEventListener("dblclick", () => startEdit(task, label));

    left.appendChild(cb);
    left.appendChild(label);

    if(task.category){
      const cat = document.createElement("span");
      cat.className = "category-badge";
      cat.textContent = task.category;
      left.appendChild(cat);
    }

    const actions = document.createElement("div");
    actions.className = "actions";

    const editBtn = document.createElement("button");
    editBtn.className = "icon-btn";
    editBtn.title = "Edit";
    editBtn.innerHTML = "✎";
    editBtn.addEventListener("click", () => startEdit(task, label));

    const delBtn = document.createElement("button");
    delBtn.className = "icon-btn";
    delBtn.title = "Delete";
    delBtn.innerHTML = "🗑";
    delBtn.addEventListener("click", () => {
      if(confirm("Delete this task?")) {
        api.delete(task.id).then(() => { tasks = tasks.filter(t => t.id !== task.id); renderTasks(); });
      }
    });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(left);
    li.appendChild(actions);
    taskList.appendChild(li);
  });
  renderCounts();
}

function renderCounts(){
  totalCount.textContent = tasks.length;
  completedCount.textContent = tasks.filter(t => t.done).length;
}

function addTask(){
  const text = taskInput.value.trim();
  const category = categoryInput.value.trim();
  if(!text) return;
  api.create({text, category}).then(created => {
    tasks.push(created);
    taskInput.value = "";
    categoryInput.value = "";
    renderTasks();
    // scroll to bottom
    taskList.scrollTop = taskList.scrollHeight;
  });
}

function startEdit(task, labelEl){
  const input = document.createElement("input");
  input.type = "text";
  input.value = task.text;
  input.style.flex = "1";
  input.style.fontSize = "1rem";
  labelEl.replaceWith(input);
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);

  function commit(){
    const v = input.value.trim();
    if(v && v !== task.text){
      api.update(task.id, {text: v}).then(updated => {
        task.text = updated.text;
        renderTasks();
      });
    } else {
      renderTasks();
    }
  }
  input.addEventListener("blur", commit);
  input.addEventListener("keydown", (e) => {
    if(e.key === "Enter"){ commit(); }
    if(e.key === "Escape"){ renderTasks(); }
  });
}

// clear completed
clearCompleted.addEventListener("click", () => {
  if(!confirm("Remove all completed tasks?")) return;
  const completed = tasks.filter(t => t.done);
  Promise.all(completed.map(t => api.delete(t.id))).then(() => {
    tasks = tasks.filter(t => !t.done);
    renderTasks();
  });
});

// clear all
clearAll.addEventListener("click", () => {
  if(!confirm("Clear ALL tasks? This cannot be undone.")) return;
  // delete one by one for simplicity
  Promise.all(tasks.map(t => api.delete(t.id))).then(() => {
    tasks = [];
    renderTasks();
  });
});

// export
exportBtn.addEventListener("click", () => api.export());

// add handlers
addBtn.addEventListener("click", addTask);
taskInput.addEventListener("keydown", (e) => { if(e.key === "Enter") addTask(); });
categoryInput.addEventListener("keydown", (e) => { if(e.key === "Enter") addTask(); });

// enable drag and drop with SortableJS
const sortable = new Sortable(taskList, {
  animation: 150,
  handle: ".left",
  onEnd: () => {
    // build new order by reading li.dataset.id
    const ids = Array.from(taskList.children).map(li => parseInt(li.dataset.id)).filter(Boolean);
    // optimistic reorder locally
    const newTasks = [];
    ids.forEach(id => {
      const t = tasks.find(x => x.id === id);
      if(t) newTasks.push(t);
    });
    tasks = newTasks;
    renderTasks();
    api.reorder(ids);
  }
});

// initial load
load();