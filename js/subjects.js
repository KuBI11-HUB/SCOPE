// subjects.js - Subject Manager: tabs, list, add, rename, delete (with cascade).

// Checks a subject name. Returns an error text, or "" if fine.
// ignoreId lets a subject keep its own name when it is renamed.
function checkSubjectName(name, ignoreId) {
  if (name === "") {
    return "Subject name is required.";
  }
  for (let i = 0; i < subjects.length; i++) {
    const sameName = subjects[i].name.toLowerCase() === name.toLowerCase();
    if (sameName && subjects[i].id !== ignoreId) {
      return "A subject with that name already exists.";
    }
  }
  return "";
}

// ---------- Drawing ----------
function createSubjectRow(subject) {
  const row = document.createElement("li");
  const nameText = document.createElement("span");
  nameText.textContent = "Selected subject: " + subject.name;   // textContent = plain text, never HTML
  row.appendChild(nameText);
  const renameButton = makeButton("Rename", function () { renameSubject(subject.id); }, "edit");
  renameButton.className = "leader-only";
  row.appendChild(renameButton);
  const deleteButton = makeButton("Delete", function () { deleteSubject(subject.id); }, "trash");
  deleteButton.className = "leader-only";
  row.appendChild(deleteButton);
  return row;
}

function renderSubjects() {
  const list = document.getElementById("subject-list");
  list.innerHTML = "";   // clear first so rows are never drawn twice
  if (subjects.length === 0) {
    addEmptyRow(list, "No subjects yet. Type a name above and click Add Subject.");
    return;
  }
  // The tabs already list every subject, so only the selected one gets Rename / Delete.
  const selected = findSubject(selectedSubjectId);
  if (selected !== undefined) {
    list.appendChild(createSubjectRow(selected));
  }
}

function createTabButton(subject) {
  const button = makeButton(subject.name, function () { selectSubject(subject.id); });
  const isSelected = subject.id === selectedSubjectId;
  if (isSelected) {
    button.className = "selected";
  }
  button.setAttribute("aria-pressed", isSelected);   // tells screen readers which tab is on
  return button;
}

function renderSubjectTabs() {
  const nav = document.getElementById("subject-tabs");
  nav.innerHTML = "";
  for (let i = 0; i < subjects.length; i++) {
    nav.appendChild(createTabButton(subjects[i]));
  }
}

// ---------- Actions ----------
// Runs when a tab is clicked.
function selectSubject(subjectId) {
  selectedSubjectId = subjectId;
  selectedProjectId = null;   // a project of another subject must not stay open
  renderAll();
}

// Runs when the Add Subject form is submitted.
function addSubject(event) {
  event.preventDefault();   // stops the browser from reloading the page

  if (!canManageSubjects()) {
    showMessage("Only the active project Leader can add subjects.", true);
    return;
  }

  const input = document.getElementById("subject-name");
  const name = input.value.trim();

  const error = checkSubjectName(name, null);
  if (error !== "") {
    showMessage(error, true);
    return;
  }

  const newSubject = { id: makeId("subject"), name: name };
  subjects.push(newSubject);
  if (selectedSubjectId === null) {
    selectedSubjectId = newSubject.id;   // the first subject becomes the selected tab
  }
  saveData();
  input.value = "";
  renderAll();
  showMessage('Subject "' + name + '" added.', false);
}

// Runs when Rename is clicked.
async function renameSubject(subjectId) {
  if (!isActiveLeader()) {
    showMessage("Only the active project Leader can rename subjects.", true);
    return;
  }

  const subject = findSubject(subjectId);
  const answer = await showPromptDialog({
    title: "Rename subject",
    message: "Enter a new name for " + subject.name + ".",
    inputLabel: "Subject name",
    initialValue: subject.name,
    confirmLabel: "Save"
  });
  if (answer === null) {
    return;   // Cancel: change nothing
  }

  const newName = answer.trim();
  const error = checkSubjectName(newName, subjectId);
  if (error !== "") {
    showMessage(error, true);
    return;
  }

  subject.name = newName;
  saveData();
  renderAll();
  showMessage('Subject renamed to "' + newName + '".', false);
}

// Runs when Delete is clicked. Also deletes everything under the subject.
async function deleteSubject(subjectId) {
  if (!isActiveLeader()) {
    showMessage("Only the active project Leader can delete subjects.", true);
    return;
  }

  const subject = findSubject(subjectId);
  const sure = await showConfirmDialog({
    title: "Delete subject?",
    message: 'Delete "' + subject.name + '"? Its projects, members, and tasks will also be deleted.',
    confirmLabel: "Delete subject",
    destructive: true
  });
  if (!sure) {
    return;
  }

  // Step 1: collect this subject's project ids BEFORE removing the projects.
  const projectIds = [];
  for (let i = 0; i < projects.length; i++) {
    if (projects[i].subjectId === subjectId) {
      projectIds.push(projects[i].id);
    }
  }

  // Steps 2-5: keep everything that does NOT belong to the deleted subject.
  tasks = tasks.filter(t => !projectIds.includes(t.projectId));
  members = members.filter(m => !projectIds.includes(m.projectId));
  projects = projects.filter(p => p.subjectId !== subjectId);
  subjects = subjects.filter(s => s.id !== subjectId);

  // Keep the screen state valid.
  if (selectedSubjectId === subjectId) {
    selectedSubjectId = subjects.length > 0 ? subjects[0].id : null;
  }
  if (!projects.some(p => p.id === selectedProjectId)) {
    selectedProjectId = null;   // the open project was deleted with the subject
  }
  fixActivePerson();

  saveData();
  renderAll();
  showMessage('Subject "' + subject.name + '" deleted.', false);
}
