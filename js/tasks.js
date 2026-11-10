// tasks.js - Tasks: create and assign (Leader), change status, reassign (Leader).

const TASK_STATUSES = ["To Do", "Doing", "Done"];

// Adds one <option> per roster member to a <select>. option.value = the member's id.
function fillPersonOptions(select, roster) {
  for (let i = 0; i < roster.length; i++) {
    const option = document.createElement("option");
    option.value = roster[i].id;
    option.textContent = roster[i].name;
    select.appendChild(option);
  }
}

// Checks the task form. Returns an error text, or "" if fine.
function checkTaskInput(title, assigneeId, dueDate) {
  if (title === "") {
    return "Task title is required.";
  }
  if (assigneeId === "") {
    return "Choose who the task is assigned to.";
  }
  if (dueDate === "") {
    return "Due date is required.";
  }
  return "";
}

// THE status rule: the Leader may change any task; a Member only their own.
function canChangeStatus(task) {
  // A scored task is locked for Members. Only the Leader can still move it.
  if (task.score !== null && !isActiveLeader()) {
    return false;
  }
  return isActiveLeader() || task.assigneeId === activePerson;
}

// ---------- Drawing ----------
// Status dropdown for one task. Disabled when the active person may not change it.
function makeStatusControl(task) {
  const select = document.createElement("select");
  select.setAttribute("aria-label", "Status of " + task.title);
  for (let i = 0; i < TASK_STATUSES.length; i++) {
    const option = document.createElement("option");
    option.value = TASK_STATUSES[i];
    option.textContent = TASK_STATUSES[i];
    select.appendChild(option);
  }
  select.value = task.status;
  select.disabled = !canChangeStatus(task);
  select.addEventListener("change", function () {
    updateTaskStatus(task.id, select.value);
  });
  return select;
}

// Reassign dropdown (Leader only) listing the project's roster.
function makeReassignControl(task) {
  const wrapper = document.createElement("span");
  wrapper.className = "leader-only";   // applyRoleView() hides it for Members
  wrapper.appendChild(document.createTextNode("Reassign to:"));

  const select = document.createElement("select");
  select.setAttribute("aria-label", "Reassign " + task.title);
  fillPersonOptions(select, getRoster(task.projectId));
  select.value = task.assigneeId;
  select.addEventListener("change", function () {
    reassignTask(task.id, select.value);
  });
  wrapper.appendChild(select);
  return wrapper;
}

function createTaskRow(task) {
  const row = document.createElement("li");
  if (isOverdue(task)) {
    row.className = "overdue-row";   // red bar; the word OVERDUE is also shown
  }
  const assignee = findMember(task.assigneeId);   // assigneeId links to a member

  const title = document.createElement("strong");
  title.textContent = task.title;
  const details = document.createElement("span");
  details.textContent = " | Due " + task.dueDate + (isOverdue(task) ? " OVERDUE" : "") + " | Assigned to " + (assignee ? assignee.name : "(unknown)") + " | Status:";

  row.appendChild(title);
  row.appendChild(details);
  row.appendChild(makeStatusControl(task));
  row.appendChild(makeReassignControl(task));
  addScoreControls(row, task);   // score text + Score button (scoring.js)
  const deleteButton = makeButton("Delete", function () { deleteTask(task.id); }, "trash");
  deleteButton.className = "leader-only";
  row.appendChild(deleteButton);
  return row;
}

// Draws the task form and the task list of the open project.
function renderTasks() {
  const detail = document.getElementById("task-detail");
  const label = document.getElementById("tasks-project-label");
  const list = document.getElementById("task-list");
  list.innerHTML = "";

  if (selectedProjectId === null) {
    detail.hidden = true;
    label.textContent = "Open a project to see its tasks.";
    return;
  }

  detail.hidden = false;
  label.textContent = "Tasks in: " + findProject(selectedProjectId).name;

  // The assignee dropdown is built ONLY from this project's roster.
  const assigneeSelect = document.getElementById("task-assignee");
  assigneeSelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "-- choose a person --";
  assigneeSelect.appendChild(placeholder);
  fillPersonOptions(assigneeSelect, getRoster(selectedProjectId));

  // projectId is the link; the Status filter ("" = All) narrows the list further.
  const statusFilter = document.getElementById("task-status-filter").value;
  const projectTasks = tasks.filter(t =>
    t.projectId === selectedProjectId && (statusFilter === "" || t.status === statusFilter));
  // Overdue first, then earliest due date. sort() reorders this filtered copy, not the saved list.
  projectTasks.sort(function (a, b) {
    if (isOverdue(a) !== isOverdue(b)) {
      return isOverdue(a) ? -1 : 1;
    }
    return a.dueDate.localeCompare(b.dueDate);
  });
  document.getElementById("task-count").textContent = projectTasks.length + " task(s) shown";
  if (projectTasks.length === 0) {
    addEmptyRow(list, "No tasks found.");
    return;
  }
  for (let i = 0; i < projectTasks.length; i++) {
    list.appendChild(createTaskRow(projectTasks[i]));
  }
}

// ---------- Actions ----------
// Runs when the Add Task form is submitted.
function addTask(event) {
  event.preventDefault();

  if (!isActiveLeader()) {
    showMessage("Only the Leader can create tasks.", true);
    return;
  }

  const titleInput = document.getElementById("task-title");
  const assigneeSelect = document.getElementById("task-assignee");
  const dueInput = document.getElementById("task-due");

  const title = titleInput.value.trim();
  const assigneeId = assigneeSelect.value;
  const dueDate = dueInput.value;

  const error = checkTaskInput(title, assigneeId, dueDate);
  if (error !== "") {
    showMessage(error, true);
    return;
  }

  // Second check: the chosen person must really be on THIS project's roster.
  if (!getRoster(selectedProjectId).some(m => m.id === assigneeId)) {
    showMessage("That person is not in this project.", true);
    return;
  }

  tasks.push({
    id: makeId("task"),
    projectId: selectedProjectId,   // link: task -> project
    title: title,
    assigneeId: assigneeId,         // link: task -> member
    dueDate: dueDate,
    status: "To Do",
    score: null,
    comment: ""
  });

  saveData();
  titleInput.value = "";
  dueInput.value = "";
  renderAll();
  showMessage('Task "' + title + '" added as To Do.', false);
}

// Runs when a status dropdown changes.
async function updateTaskStatus(taskId, newStatus) {
  const task = tasks.find(t => t.id === taskId);

  if (!canChangeStatus(task)) {
    showMessage("You can only change the status of your own tasks.", true);
    renderAll();   // put the dropdown back to the saved status
    return;
  }

  // A scored task leaving Done loses its score, so ask first.
  if (task.score !== null && newStatus !== "Done") {
    const sure = await showConfirmDialog({
      title: "Clear this score?",
      message: "Moving this task out of Done will clear its score. Continue?",
      confirmLabel: "Move task",
      destructive: true
    });
    if (!sure) {
      renderAll();   // put the dropdown back
      return;
    }
    task.score = null;
    task.comment = "";
  }
  task.status = newStatus;
  saveData();
  renderAll();
  showMessage('"' + task.title + '" is now ' + newStatus + '.', false);
}

// Runs when a Reassign dropdown changes.
function reassignTask(taskId, newAssigneeId) {
  if (!isActiveLeader()) {
    showMessage("Only the Leader can reassign tasks.", true);
    return;
  }

  const task = tasks.find(t => t.id === taskId);
  const person = findMember(newAssigneeId);
  task.assigneeId = newAssigneeId;

  saveData();
  renderAll();
  showMessage('"' + task.title + '" is now assigned to ' + person.name + '.', false);
}

// Runs when a task's Delete is clicked (Leader only).
async function deleteTask(taskId) {
  if (!isActiveLeader()) {
    showMessage("Only the Leader can delete tasks.", true);
    return;
  }
  const task = tasks.find(t => t.id === taskId);
  const sure = await showConfirmDialog({
    title: "Delete task?",
    message: 'Delete "' + task.title + '"?',
    confirmLabel: "Delete task",
    destructive: true
  });
  if (!sure) {
    return;
  }
  tasks = tasks.filter(t => t.id !== taskId);
  saveData();
  renderAll();
  showMessage('Task "' + task.title + '" deleted.', false);
}

// One-line health summary of a project's tasks, e.g. "2 To Do, 1 Doing, 2 Done | 1 OVERDUE".
function projectSummary(projectId) {
  let todo = 0;
  let doing = 0;
  let done = 0;
  let overdue = 0;
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].projectId !== projectId) {
      continue;   // skip tasks of other projects
    }
    if (tasks[i].status === "To Do") { todo++; }
    if (tasks[i].status === "Doing") { doing++; }
    if (tasks[i].status === "Done") { done++; }
    if (isOverdue(tasks[i])) { overdue++; }
  }
  if (todo + doing + done === 0) {
    return "No tasks yet";
  }
  return todo + " To Do, " + doing + " Doing, " + done + " Done" + (overdue > 0 ? " | " + overdue + " OVERDUE" : "");
}
