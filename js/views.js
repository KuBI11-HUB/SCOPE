// views.js - page navigation. Only ONE view is visible at a time.

let currentView = "projects";   // screen state: memory only, not saved

const VIEW_IDS = { projects: "view-projects", detail: "view-detail", mytasks: "view-mytasks" };
const NAV_IDS = { projects: "nav-projects", detail: "nav-detail", mytasks: "nav-mytasks" };

// Runs when a nav button is clicked.
function showView(name) {
  currentView = name;
  renderViews();
}

// Shows the current view, hides the others, and marks the matching nav button.
function renderViews() {
  // Project Detail needs an open project. If none is open (for example it was just deleted), go back.
  if (currentView === "detail" && selectedProjectId === null) {
    currentView = "projects";
  }
  for (const name in VIEW_IDS) {
    const isCurrent = name === currentView;
    document.getElementById(VIEW_IDS[name]).hidden = !isCurrent;
    const button = document.getElementById(NAV_IDS[name]);
    button.className = isCurrent ? "selected" : "";
    button.setAttribute("aria-pressed", isCurrent);
  }
  document.getElementById("nav-detail").disabled = selectedProjectId === null;
}
