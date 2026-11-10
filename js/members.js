// members.js - Member Manager: roster of the open project, add, Make Leader, Remove.

// Checks a new member's name. Returns an error text, or "" if fine.
function checkMemberName(name) {
  if (name === "") {
    return "Member name is required.";
  }
  const roster = getRoster(selectedProjectId);   // duplicates are checked only inside THIS project
  for (let i = 0; i < roster.length; i++) {
    if (roster[i].name.toLowerCase() === name.toLowerCase()) {
      return "That name is already in this project.";
    }
  }
  return "";
}

// ---------- Drawing ----------
// How many tasks are assigned to a member. This is the same count that blocks Remove.
function countTasks(memberId) {
  return tasks.filter(t => t.assigneeId === memberId).length;
}

// One table row: Name | Role | Tasks | Average score | Actions
function createMemberRow(member) {
  const row = document.createElement("tr");
  row.appendChild(makeCell(member.name));
  row.appendChild(makeCell(member.role));
  row.appendChild(makeCell(countTasks(member.id)));
  row.appendChild(makeCell(averageText(member.id)));

  const actions = document.createElement("td");
  actions.className = "leader-only";   // applyRoleView() hides this cell (and its header) for Members
  // Only Member rows get Make Leader. The Leader is already the Leader.
  if (member.role === "Member") {
    actions.appendChild(makeButton("Make Leader", function () { makeLeader(member.id); }, "leader"));
  }
  actions.appendChild(makeButton("Remove", function () { removeMember(member.id); }, "trash"));
  row.appendChild(actions);
  return row;
}

// Shows the roster of the open project, or hides the whole block.
function renderRoster() {
  const detail = document.getElementById("project-detail");
  const list = document.getElementById("member-list");
  list.innerHTML = "";

  if (selectedProjectId === null) {
    detail.hidden = true;
    return;
  }

  detail.hidden = false;
  document.getElementById("project-detail-heading").textContent =
    "Members of: " + findProject(selectedProjectId).name;

  const roster = getRoster(selectedProjectId);
  for (let i = 0; i < roster.length; i++) {
    list.appendChild(createMemberRow(roster[i]));
  }
}

// ---------- Actions ----------
// Runs when the Add Member form is submitted.
function addMember(event) {
  event.preventDefault();

  if (!isActiveLeader()) {   // the UI hides the form, but the function checks the rule too
    showMessage("Only the Leader can add members.", true);
    return;
  }

  const input = document.getElementById("member-name");
  const name = input.value.trim();

  const error = checkMemberName(name);
  if (error !== "") {
    showMessage(error, true);
    return;
  }

  members.push({
    id: makeId("member"),
    projectId: selectedProjectId,
    name: name,
    role: "Member"   // new people are always Members, so the Leader count never changes here
  });

  saveData();
  input.value = "";
  renderAll();
  showMessage('"' + name + '" added as a Member.', false);
}

// Runs when Make Leader is clicked.
async function makeLeader(memberId) {
  if (!isActiveLeader()) {
    showMessage("Only the Leader can change the Leader.", true);
    return;
  }

  const project = findProject(selectedProjectId);
  const newLeader = findMember(memberId);
  const oldLeader = findMember(project.leaderId);

  const sure = await showConfirmDialog({
    title: "Change project leader?",
    message: "Make " + newLeader.name + " the Leader? " + oldLeader.name + " will become a Member.",
    confirmLabel: "Make leader"
  });
  if (!sure) {
    return;
  }

  // These three lines run together, so there is always exactly one Leader.
  oldLeader.role = "Member";
  newLeader.role = "Leader";
  project.leaderId = newLeader.id;

  saveData();
  renderAll();

  let text = newLeader.name + " is now the Leader. " + oldLeader.name + " is now a Member.";
  if (activePerson === oldLeader.id) {
    text += " Switch Acting as to " + newLeader.name + " to keep using Leader controls.";
  }
  showMessage(text, false);
}

// Runs when Remove is clicked.
async function removeMember(memberId) {
  if (!isActiveLeader()) {
    showMessage("Only the Leader can remove members.", true);
    return;
  }

  const member = findMember(memberId);

  // Check 1: the Leader cannot be removed.
  if (member.role === "Leader") {
    showMessage("The Leader cannot be removed. Make another member the Leader first.", true);
    return;
  }

  // Check 2: some() is true as soon as ONE task points at this member.
  if (tasks.some(t => t.assigneeId === memberId)) {
    showMessage(member.name + " still has tasks. Reassign them before removing this member.", true);
    return;
  }

  const sure = await showConfirmDialog({
    title: "Remove member?",
    message: "Remove " + member.name + " from this project?",
    confirmLabel: "Remove member",
    destructive: true
  });
  if (!sure) {
    return;
  }

  members = members.filter(m => m.id !== memberId);
  saveData();
  renderAll();
  showMessage(member.name + " was removed.", false);
}
