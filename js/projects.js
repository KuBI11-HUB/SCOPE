// projects.js - Project Manager: list, open, add (auto-adds the Leader), delete (with cascade).

// Checks the project form. Returns an error text, or "" if fine.
function checkProjectInput(name, deadline, leaderName) {
  if (name === "") {
    return "Project name is required.";
  }
  if (deadline === "") {
    return "Deadline is required.";
  }
  // Dates in "YYYY-MM-DD" form compare correctly as text.
  if (deadline < todayString()) {
    return "Deadline cannot be in the past.";
  }
  if (leaderName === "") {
    return "Leader's name is required.";
  }
  return "";
}

// ---------- Drawing ----------
function createProjectRow(project) {
  const row = document.createElement("li");
  if (project.id === selectedProjectId) {
    row.className = "selected-row";
  }
  const leader = findMember(project.leaderId);

  // Line 1: the name and the buttons.
  const line1 = document.createElement("div");
  const nameText = document.createElement("strong");
  nameText.textContent = project.name;
  line1.appendChild(nameText);
  const openButton = makeButton("Open", function () { selectProject(project.id); });
  openButton.className = "btn-primary";   // CSS hook only: styles Open as the primary button
  line1.appendChild(openButton);
  line1.appendChild(makeButton("Delete", function () { deleteProject(project.id); }));

  // Line 2 (smaller, gray): due date, leader, status.
  const line2 = document.createElement("div");
  line2.className = "meta";
  line2.appendChild(document.createTextNode("Due " + project.deadline +
    " | Leader: " + (leader ? leader.name : "(none)") + " | Status: "));
  line2.appendChild(makeProjectStatusControl(project));

  // Line 3: task health at a glance.
  const line3 = document.createElement("div");
  line3.className = "meta";
  line3.textContent = "Tasks: " + projectSummary(project.id);

  row.appendChild(line1);
  row.appendChild(line2);
  row.appendChild(line3);
  return row;
}

// Draws the projects of the selected subject and shows/hides the form.
function renderProjects() {
  const form = document.getElementById("project-form");
  const label = document.getElementById("projects-subject-label");
  const list = document.getElementById("project-list");
  list.innerHTML = "";

  if (selectedSubjectId === null) {
    form.hidden = true;
    label.textContent = "";
    addEmptyRow(list, "Add or select a subject to see its projects.");
    return;
  }

  form.hidden = false;
  label.textContent = "Projects in: " + findSubject(selectedSubjectId).name;

  // subjectId is the link: keep only projects of the selected subject.
  const subjectProjects = projects.filter(p => p.subjectId === selectedSubjectId);
  if (subjectProjects.length === 0) {
    addEmptyRow(list, "No projects in this subject yet.");
    return;
  }
  for (let i = 0; i < subjectProjects.length; i++) {
    list.appendChild(createProjectRow(subjectProjects[i]));
  }
}

// ---------- Actions ----------
// Runs when an Open button is clicked.
function selectProject(projectId) {
  selectedProjectId = projectId;
  currentView = "detail";   // Open jumps to the Project Detail view
  fixActivePerson();   // if the active person is not on this roster, use its Leader
  saveData();          // activePerson may have changed
  renderAll();
}

// Runs when the Add Project form is submitted.
function addProject(event) {
  event.preventDefault();

  const nameInput = document.getElementById("project-name");
  const deadlineInput = document.getElementById("project-deadline");
  const leaderInput = document.getElementById("leader-name");

  const name = nameInput.value.trim();
  const deadline = deadlineInput.value;
  const leaderName = leaderInput.value.trim();

  const error = checkProjectInput(name, deadline, leaderName);
  if (error !== "") {
    showMessage(error, true);
    return;
  }

  // Make both ids first so the project can store leaderId.
  const projectId = makeId("project");
  const leaderId = makeId("member");

  projects.push({
    id: projectId,
    subjectId: selectedSubjectId,   // link: project -> subject
    name: name,
    deadline: deadline,
    status: "Not Started",
    leaderId: leaderId
  });

  // The Leader joins the roster at the moment the project is created.
  members.push({
    id: leaderId,
    projectId: projectId,           // link: member -> project
    name: leaderName,
    role: "Leader"
  });

  saveData();
  nameInput.value = "";
  deadlineInput.value = "";
  leaderInput.value = "";
  renderAll();
  showMessage('Project "' + name + '" added. ' + leaderName + ' is the Leader.', false);
}

// Runs when a project's Delete is clicked. Also deletes its tasks and members.
function deleteProject(projectId) {
  const project = findProject(projectId);
  const sure = confirm('Delete "' + project.name + '"? Its members and tasks will also be deleted.');
  if (!sure) {
    return;
  }

  // Order: tasks, then members, then the project. All matched by projectId.
  tasks = tasks.filter(t => t.projectId !== projectId);
  members = members.filter(m => m.projectId !== projectId);
  projects = projects.filter(p => p.id !== projectId);

  if (selectedProjectId === projectId) {
    selectedProjectId = null;   // the open project was deleted: close it
  }
  fixActivePerson();            // the active person may have been deleted with it

  saveData();
  renderAll();
  showMessage('Project "' + project.name + '" deleted.', false);
}

// ---------- Project status (Leader of THAT project only) ----------
const PROJECT_STATUSES = ["Not Started", "Ongoing", "Completed"];

// The Leader of this project gets a dropdown. Everyone else sees plain text.
function makeProjectStatusControl(project) {
  if (project.leaderId !== activePerson) {
    return makeBadge(project.status);
  }
  const select = document.createElement("select");
  select.setAttribute("aria-label", "Status of project " + project.name);
  for (let i = 0; i < PROJECT_STATUSES.length; i++) {
    const option = document.createElement("option");
    option.value = PROJECT_STATUSES[i];
    option.textContent = PROJECT_STATUSES[i];
    select.appendChild(option);
  }
  select.value = project.status;
  select.addEventListener("change", function () {
    updateProjectStatus(project.id, select.value);
  });
  return select;
}

// Runs when the project status dropdown changes.
function updateProjectStatus(projectId, newStatus) {
  const project = findProject(projectId);
  if (project.leaderId !== activePerson) {
    showMessage("Only the Leader can change the project status.", true);
    renderAll();
    return;
  }
  project.status = newStatus;
  saveData();
  renderAll();
  showMessage('Project "' + project.name + '" is now ' + newStatus + ".", false);
}
