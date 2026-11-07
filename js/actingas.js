// actingas.js - Acting as: who the app pretends you are, and what that shows or hides.
// This is a demonstration. It is not security.

// True if the active person exists and is a Leader.
function isActiveLeader() {
  const person = findMember(activePerson);
  return person !== undefined && person.role === "Leader";
}

// Keeps activePerson valid. Call it after anything that can remove people or switch projects.
function fixActivePerson() {
  // 1. A saved person who no longer exists is forgotten.
  if (!members.some(m => m.id === activePerson)) {
    activePerson = null;
  }
  // 2. If a project is open, the active person must be on its roster. If not, use its Leader.
  if (selectedProjectId !== null) {
    const roster = getRoster(selectedProjectId);
    if (!roster.some(m => m.id === activePerson)) {
      const leader = roster.find(m => m.role === "Leader");
      activePerson = leader ? leader.id : null;
    }
  }
}

// Fills the dropdown with the open project's members.
function renderActingAs() {
  const select = document.getElementById("acting-as");
  select.innerHTML = "";

  if (selectedProjectId === null) {
    select.disabled = true;
    const placeholder = document.createElement("option");
    placeholder.textContent = "(open a project first)";
    select.appendChild(placeholder);
    return;
  }

  select.disabled = false;
  const roster = getRoster(selectedProjectId);
  for (let i = 0; i < roster.length; i++) {
    const option = document.createElement("option");
    option.value = roster[i].id;                                          // what the code reads
    option.textContent = roster[i].name + " (" + roster[i].role + ")";   // what the user sees
    select.appendChild(option);
  }
  select.value = activePerson;
}

// The ONE function that decides what Leader-only controls show.
// Every Leader-only element has the class "leader-only".
function applyRoleView() {
  const isLeader = isActiveLeader();

  const controls = document.querySelectorAll(".leader-only");
  for (let i = 0; i < controls.length; i++) {
    controls[i].hidden = !isLeader;
  }

  const status = document.getElementById("acting-as-status");
  const person = findMember(activePerson);
  if (selectedProjectId === null || person === undefined) {
    status.textContent = "";
  } else {
    status.textContent = "Acting as " + person.name + " (" + person.role + "). " +
      (isLeader ? "Leader controls are shown." : "Leader controls are hidden.");
  }
}

// Runs when the dropdown changes.
function setActivePerson() {
  activePerson = document.getElementById("acting-as").value;
  saveData();
  renderAll();   // task status dropdowns depend on who is active, so redraw everything

  const person = findMember(activePerson);
  showMessage("Now acting as " + person.name + " (" + person.role + ").", false);
}
