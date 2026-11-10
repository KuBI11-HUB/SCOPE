// app.js - starts the app and redraws the whole page.
// The rules live in the other files. This file only connects them.

// Redraws every area. applyRoleView() is LAST because it hides buttons that were just created.
function renderAll() {
  renderSubjects();
  renderSubjectTabs();
  renderProjects();
  renderRoster();
  renderActingAs();
  renderTasks();
  renderMyTasks();
  clearFieldFeedback();
  renderViews();
  updateFilterButtons();
  applyRoleView();
}

// When the page is ready: load saved data, draw it, attach every listener.
document.addEventListener("DOMContentLoaded", function () {
  loadData();
  initializeButtonIcons();
  fixActivePerson();   // forget a saved person who no longer exists
  if (subjects.length > 0) {
    selectedSubjectId = subjects[0].id;
  }
  renderAll();

  document.getElementById("subject-form").addEventListener("submit", addSubject);
  document.getElementById("project-form").addEventListener("submit", addProject);
  document.getElementById("member-form").addEventListener("submit", addMember);
  document.getElementById("task-form").addEventListener("submit", addTask);
  document.getElementById("acting-as").addEventListener("change", setActivePerson);
  attachFieldFeedback();
  document.getElementById("task-status-filter").addEventListener("change", applyFilters);
  document.getElementById("mytasks-search").addEventListener("input", applyFilters);
  document.getElementById("mytasks-subject").addEventListener("change", applyFilters);
  document.getElementById("mytasks-status").addEventListener("change", applyFilters);
  document.getElementById("clear-filters").addEventListener("click", clearFilters);
  document.getElementById("clear-task-filter").addEventListener("click", clearFilters);
  document.getElementById("reset-data").addEventListener("click", resetData);
  document.getElementById("nav-projects").addEventListener("click", function () { showView("projects"); });
  document.getElementById("nav-detail").addEventListener("click", function () { showView("detail"); });
  document.getElementById("nav-mytasks").addEventListener("click", function () { showView("mytasks"); });
});

async function resetData() {
  const sure = await showConfirmDialog({
    title: "Reset all data?",
    message: "This deletes " + subjects.length + " subjects, " + projects.length +
      " projects, " + members.length + " members and " + tasks.length +
      " tasks. This cannot be undone.",
    confirmLabel: "Reset data",
    destructive: true,
    inputLabel: "Type RESET to confirm",
    expectedValue: "RESET"
  });
  if (!sure) {
    return;
  }

  subjects = [];
  projects = [];
  members = [];
  tasks = [];
  activePerson = null;
  selectedSubjectId = null;
  selectedProjectId = null;
  saveData();
  clearFilters();
  renderAll();
  showMessage("All data was reset.", false);
}
