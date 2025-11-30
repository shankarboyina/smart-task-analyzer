// script.js — enhanced frontend: add/edit/remove unlimited tasks + animations + cancel support
const API_ANALYZE = "http://127.0.0.1:8000/api/tasks/analyze/";
const API_SUGGEST = "http://127.0.0.1:8000/api/tasks/suggest/";

const tasksArea = document.getElementById("tasksArea");
const analyzeBtn = document.getElementById("analyzeBtn");
const suggestBtn = document.getElementById("suggestBtn");
const loadSample = document.getElementById("loadSample");
const resultsEl = document.getElementById("results");
const statusEl = document.getElementById("status");
const strategyEl = document.getElementById("strategy");
const suggestionsWrap = document.getElementById("suggestions");
const suggestList = document.getElementById("suggestList");
const resultHeader = document.getElementById("resultHeader");
const resultTitle = document.getElementById("resultTitle");
const clearResults = document.getElementById("clearResults");

const addTaskBtn = document.getElementById("addTaskBtn");
const bulkPasteBtn = document.getElementById("bulkPasteBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const newIdInput = document.getElementById("newId");
const newTitleInput = document.getElementById("newTitle");
const newDueInput = document.getElementById("newDue");
const newHoursInput = document.getElementById("newHours");
const newImportanceInput = document.getElementById("newImportance");
const newDepsInput = document.getElementById("newDeps");
const liveList = document.getElementById("liveList");

let editModeId = null; // id of task being edited, null => add mode

const SAMPLE = {
  "strategy": "smart",
  "tasks": [
    { "id": "t1", "title": "Fix login bug", "due_date": "2025-12-01", "estimated_hours": 3, "importance": 8, "dependencies": [] },
    { "id": "t2", "title": "Prepare release notes", "due_date": "2025-11-30", "estimated_hours": 1, "importance": 6, "dependencies": ["t1"] },
    { "id": "t3", "title": "Refactor auth module", "due_date": null, "estimated_hours": 8, "importance": 7, "dependencies": [] }
  ]
};

function setStatus(text, isError=false){
  statusEl.textContent = text;
  statusEl.style.color = isError ? "#ffb4b4" : "#bcd9ff";
}

function escapeHtml(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;"); }

function readTasksFromTextarea(){
  const txt = tasksArea.value.trim();
  if(!txt) return [];
  try {
    const parsed = JSON.parse(txt);
    return Array.isArray(parsed) ? parsed : (parsed.tasks && Array.isArray(parsed.tasks) ? parsed.tasks : []);
  } catch(e){
    return null;
  }
}

function writeTasksToTextarea(arr){
  tasksArea.value = JSON.stringify(arr, null, 2);
  refreshLiveList();
}

function buildTaskFromForm(){
  const id = newIdInput.value.trim();
  const title = newTitleInput.value.trim() || id || `task-${Date.now()}`;
  const due = newDueInput.value.trim() || null;
  const hoursRaw = parseFloat(newHoursInput.value);
  const hours = Number.isFinite(hoursRaw) ? hoursRaw : 1;
  const impRaw = parseInt(newImportanceInput.value);
  const importance = Number.isFinite(impRaw) ? impRaw : 5;
  const deps = newDepsInput.value.split(",").map(s => s.trim()).filter(Boolean);
  return {
    id: id || `t${Date.now()}`,
    title,
    due_date: due || null,
    estimated_hours: hours,
    importance: importance,
    dependencies: deps
  };
}

function refreshLiveList(){
  liveList.innerHTML = "";
  const arr = readTasksFromTextarea();
  if(arr === null) {
    const warn = document.createElement("div");
    warn.className = "live-item";
    warn.textContent = "Textarea contains invalid JSON — fix it to see live list.";
    liveList.appendChild(warn);
    return;
  }
  // show newest first
  arr.slice().reverse().forEach(task => {
    const row = document.createElement("div");
    row.className = "live-item";
    row.innerHTML = `<div class="meta">${escapeHtml(task.id)} — ${escapeHtml(task.title)}</div>
      <div class="actions">
        <button class="btn tiny edit">Edit</button>
        <button class="btn tiny plain remove">Remove</button>
      </div>`;
    // wire edit/remove
    row.querySelector(".remove").addEventListener("click", ()=> {
      removeTaskById(task.id);
    });
    row.querySelector(".edit").addEventListener("click", ()=> {
      loadTaskToForm(task);
    });
    liveList.appendChild(row);
  });
}

function loadTaskToForm(task){
  newIdInput.value = task.id || "";
  newTitleInput.value = task.title || "";
  newDueInput.value = task.due_date || "";
  newHoursInput.value = task.estimated_hours || "";
  newImportanceInput.value = task.importance || "";
  newDepsInput.value = (task.dependencies || []).join(", ");
  editModeId = task.id || null;
  addTaskBtn.textContent = "Save";
  addTaskBtn.classList.add("primary");
  if(cancelEditBtn) cancelEditBtn.style.display = "inline-block";
  setStatus(`Editing ${task.id} — make changes and click Save`);
}

function removeTaskById(id){
  const arr = readTasksFromTextarea();
  if(!arr) { setStatus("Invalid JSON — cannot remove", true); return; }
  const newArr = arr.filter(t => t.id !== id);
  writeTasksToTextarea(newArr);
  setStatus(`Removed ${id}`);
}

addTaskBtn.addEventListener("click", (ev) => {
  ev.preventDefault();
  const arr = readTasksFromTextarea();
  if(arr === null){ setStatus("Textarea JSON invalid — fix it first", true); return; }

  const task = buildTaskFromForm();

  if(editModeId){
    const idx = arr.findIndex(t => t.id === editModeId);
    if(idx === -1){
      arr.push(task);
    } else {
      arr[idx] = task;
    }
    setStatus(`Saved ${task.id}`);
    editModeId = null;
    addTaskBtn.textContent = "Add Task";
    addTaskBtn.classList.remove("primary");
    if(cancelEditBtn) cancelEditBtn.style.display = "none";
  } else {
    arr.push(task);
    setStatus(`Added ${task.id}`);
  }

  writeTasksToTextarea(arr);

  newIdInput.value = ""; newTitleInput.value = ""; newDueInput.value = ""; newHoursInput.value = ""; newImportanceInput.value = ""; newDepsInput.value = "";
  refreshLiveList();
});

if(cancelEditBtn){
  cancelEditBtn.addEventListener("click", (e) => {
    e.preventDefault();
    editModeId = null;
    addTaskBtn.textContent = "Add Task";
    addTaskBtn.classList.remove("primary");
    newIdInput.value = ""; newTitleInput.value = ""; newDueInput.value = ""; newHoursInput.value = ""; newImportanceInput.value = ""; newDepsInput.value = "";
    setStatus("Edit cancelled");
    cancelEditBtn.style.display = "none";
  });
}

bulkPasteBtn.addEventListener("click", ()=>{
  const txt = prompt("Paste lines (each line becomes a task title). Example: 'Fix bug A' on each line.");
  if(!txt) return;
  const lines = txt.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  const arr = readTasksFromTextarea();
  if(arr === null){ setStatus("Textarea JSON invalid — fix it first", true); return; }
  for(const ln of lines){
    arr.push({
      id: `t${Date.now().toString().slice(-6)}${Math.floor(Math.random()*90)}`,
      title: ln,
      due_date: null,
      estimated_hours: 1,
      importance: 5,
      dependencies: []
    });
  }
  writeTasksToTextarea(arr);
  setStatus(`Bulk added ${lines.length} tasks`);
});

function priorityClass(score){
  if(score >= 0.7) return "priority-high";
  if(score >= 0.4) return "priority-medium";
  return "priority-low";
}
function humanScore(score){ return Math.round(score * 100); }

function createCard(t){
  const card = document.createElement("div");
  card.className = `card ${priorityClass(t.score)}`;
  card.innerHTML = `
    <div class="meta">
      <h3>${escapeHtml(t.title || t.id)}</h3>
      <div class="score">${humanScore(t.score)}%</div>
    </div>
    <div class="small">Due: ${t.raw && t.raw.due_date ? t.raw.due_date : "none"} · Importance: ${t.raw && t.raw.importance ? t.raw.importance : "n/a"} · Est: ${t.raw && t.raw.estimated_hours ? t.raw.estimated_hours : "n/a"}</div>
    <div class="comp-row">${Object.entries(t.components || {}).map(([k,v]) => `<div class="comp">${k}: ${v}</div>`).join("")}</div>
    <div class="explain">${escapeHtml(t.explanation || "")}</div>
  `;
  return card;
}

function renderTasks(data){
  resultsEl.innerHTML = "";
  resultHeader.hidden = false;
  resultTitle.textContent = `Strategy: ${data.strategy} · ${data.tasks.length} tasks`;
  if(!data.tasks || !data.tasks.length){
    resultsEl.innerHTML = `<div class="card"><div class="meta"><h3>No tasks</h3></div></div>`;
    return;
  }
  data.tasks.forEach(t => {
    resultsEl.appendChild(createCard(t));
  });
}

async function postJSON(url, payload){
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if(!resp.ok){
    const text = await resp.text();
    throw new Error(`${resp.status}: ${text.substring(0,400)}`);
  }
  return await resp.json();
}

async function analyze(){
  setStatus("Parsing tasks...");
  const txt = tasksArea.value.trim();
  if(!txt){ setStatus("No tasks provided", true); return; }
  let tasks;
  try {
    const parsed = JSON.parse(txt);
    tasks = Array.isArray(parsed) ? parsed : (parsed.tasks && Array.isArray(parsed.tasks) ? parsed.tasks : null);
    if(!tasks) throw new Error("JSON must be an array or { tasks: [...] }");
  } catch(err){
    setStatus("Invalid JSON: " + err.message, true);
    return;
  }
  const payload = { tasks, strategy: strategyEl.value || "smart" };
  setStatus("Analyzing…");
  suggestionsWrap.hidden = true;
  try {
    const data = await postJSON(API_ANALYZE, payload);
    setStatus(`Strategy: ${data.strategy} · ${data.tasks.length} tasks`);
    renderTasks(data);
  } catch(err){
    setStatus("Server error: " + err.message, true);
    resultsEl.innerHTML = `<div class="card"><pre style="color:#ffb4b4">${escapeHtml(err.message)}</pre></div>`;
  }
}

async function suggestTop(){
  setStatus("Parsing tasks...");
  const txt = tasksArea.value.trim();
  if(!txt){ setStatus("No tasks provided", true); return; }
  let tasks;
  try {
    const parsed = JSON.parse(txt);
    tasks = Array.isArray(parsed) ? parsed : (parsed.tasks && Array.isArray(parsed.tasks) ? parsed.tasks : null);
    if(!tasks) throw new Error("JSON must be an array or { tasks: [...] }");
  } catch(err){
    setStatus("Invalid JSON: " + err.message, true);
    return;
  }
  const payload = { tasks, strategy: strategyEl.value || "smart" };
  setStatus("Fetching suggestions…");
  try {
    const res = await postJSON(API_SUGGEST, payload);
    setStatus("Suggestions received");
    showSuggestions(res.suggestions || [], res.strategy);
  } catch(err){
    setStatus("Server error: " + err.message, true);
    suggestList.innerHTML = `<div style="color:#ffb4b4">Failed: ${escapeHtml(err.message)}</div>`;
    suggestionsWrap.hidden = false;
  }
}

function showSuggestions(list){
  suggestionsWrap.hidden = false;
  suggestList.innerHTML = "";
  if(!list || !list.length){ suggestList.innerHTML = `<div class="sugg">No suggestions</div>`; return; }
  list.forEach(s => {
    const el = document.createElement("div");
    el.className = "sugg";
    el.innerHTML = `<div><div class="title">${escapeHtml(s.title)}</div><div class="reason">${escapeHtml(s.reason)}</div></div><div class="score small">${humanScore(s.score)}%</div>`;
    suggestList.appendChild(el);
  });
}

clearResults.addEventListener("click", ()=>{ resultsEl.innerHTML=""; resultHeader.hidden=true; suggestionsWrap.hidden=true; setStatus("Cleared")});
analyzeBtn.addEventListener("click", analyze);
suggestBtn.addEventListener("click", suggestTop);
loadSample.addEventListener("click", ()=>{ tasksArea.value = JSON.stringify(SAMPLE.tasks, null, 2); setStatus("Sample loaded"); refreshLiveList(); suggestionsWrap.hidden=true; });
tasksArea.addEventListener("input", ()=> { refreshLiveList(); });

// initialize
tasksArea.value = JSON.stringify(SAMPLE.tasks, null, 2);
refreshLiveList();
setStatus("Ready");
