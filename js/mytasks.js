// mytasks.js - My Tasks: the active person's tasks across all subjects, with search and filters.

// Member records belong to ONE project, so the same person in two projects has two ids.
// We match by name (ignoring capitals) to find their tasks in every project.
function getMyTasks() {
  const me = findMember(activePerson);
  if (me === undefined) {
    return [];
  }
  return tasks.filter(function (t) {
    const assignee = findMember(t.assigneeId);
    return assignee !== undefined && assignee.name.toLowerCase() === me.name.toLowerCase();
  });
}

// Overdue = not Done and the due date is before today. Same-format dates compare as text.
function isOverdue(task) {
  return task.status !== "Done" && task.dueDate < todayString();
}

// Rebuilds the Subject filter but keeps the user's choice if it still exists.
function fillSubjectFilter() {
  const select = document.getElementById("mytasks-subject");
  const keep = select.value;
  select.innerHTML = "";
  const all = document.createElement("option");
  all.value = "";
  all.textContent = "All subjects";
  select.appendChild(all);
  for (let i = 0; i < subjects.length; i++) {
    const option = document.createElement("option");
    option.value = subjects[i].id;
    option.textContent = subjects[i].name;
    select.appendChild(option);
  }
  if (subjects.some(s => s.id === keep)) {
    select.value = keep;
  }
}

// One table row: Due | Task | Subject > Project | Status | Score
function createMyTaskRow(task) {
  const row = document.createElement("tr");
  const project = findProject(task.projectId);
  const subject = findSubject(project.subjectId);   // task -> project -> subject
  const overdue = isOverdue(task);
  if (overdue) {
    row.className = "overdue";   // CSS: red bar + light red row. The word OVERDUE is also in the cell.
  }
  row.appendChild(makeCell(task.dueDate + (overdue ? " OVERDUE" : "")));
  row.appendChild(makeCell(task.title));
  row.appendChild(makeCell(subject.name + " > " + project.name));
  const statusCell = document.createElement("td");
  statusCell.appendChild(makeBadge(task.status));
  row.appendChild(statusCell);
  row.appendChild(makeCell(scoreShort(task)));
  return row;
}

function renderMyTasks() {
  const label = document.getElementById("mytasks-label");
  const count = document.getElementById("mytasks-count");
  const list = document.getElementById("mytasks-list");
  list.innerHTML = "";
  fillSubjectFilter();

  const me = findMember(activePerson);
  if (me === undefined) {
    label.textContent = "Choose a person in Acting as to see their tasks.";
    count.textContent = "";
    return;
  }
  label.textContent = "Tasks assigned to " + me.name + " (all subjects)";

  const search = document.getElementById("mytasks-search").value.trim().toLowerCase();
  const subjectId = document.getElementById("mytasks-subject").value;
  const status = document.getElementById("mytasks-status").value;

  // Keep a task only if it passes all three filters. "" means "no filter".
  const result = getMyTasks().filter(function (t) {
    const matchesSearch = search === "" || t.title.toLowerCase().includes(search);
    const matchesSubject = subjectId === "" || findProject(t.projectId).subjectId === subjectId;
    const matchesStatus = status === "" || t.status === status;
    return matchesSearch && matchesSubject && matchesStatus;
  });
  result.sort(function (a, b) { return a.dueDate.localeCompare(b.dueDate); });   // earliest due first

  const filtersOn = search !== "" || subjectId !== "" || status !== "";   // filters may be tucked away, so say so
  count.textContent = result.length + " task(s) shown" + (filtersOn ? " (filters on)" : "");
  if (result.length === 0) {
    addEmptyTableRow(list, "No tasks found.", 5);
    return;
  }
  for (let i = 0; i < result.length; i++) {
    list.appendChild(createMyTaskRow(result[i]));
  }
}

// Runs when a search box or filter changes. Redraws both task lists.
function applyFilters() {
  renderTasks();
  renderMyTasks();
  updateFilterButtons();
  applyRoleView();   // renderTasks just built new Leader-only buttons
}

function updateFilterButtons() {
  const myTasksFiltersOn =
    document.getElementById("mytasks-search").value.trim() !== "" ||
    document.getElementById("mytasks-subject").value !== "" ||
    document.getElementById("mytasks-status").value !== "";
  const taskFilterOn = document.getElementById("task-status-filter").value !== "";
  document.getElementById("clear-filters").hidden = !myTasksFiltersOn;
  document.getElementById("clear-task-filter").hidden = !taskFilterOn;
}

// Runs when Clear Filters is clicked.
function clearFilters() {
  document.getElementById("mytasks-search").value = "";
  document.getElementById("mytasks-subject").value = "";
  document.getElementById("mytasks-status").value = "";
  document.getElementById("task-status-filter").value = "";
  applyFilters();
}
