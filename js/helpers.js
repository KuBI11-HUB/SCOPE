// helpers.js - small tools shared by every other file.

// Screen state: which tab and which project are open.
// Memory only. It is not saved, because it is not data.
let selectedSubjectId = null;
let selectedProjectId = null;

// Shows one short message in #message. isError true = red, false = green.
function showMessage(text, isError) {
  const box = document.getElementById("message");
  box.textContent = (isError ? "Error: " : "Done: ") + text;   // the word shows the type, not only the color
  box.className = isError ? "error" : "success";
}

// Makes a button that runs onClick when clicked.
// type = "button" so it never submits a form by accident.
function makeButton(text, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.addEventListener("click", onClick);
  return button;
}

// Adds a plain "nothing here yet" row to a list.
function addEmptyRow(list, text) {
  const row = document.createElement("li");
  row.textContent = text;
  list.appendChild(row);
}

// Today's date as "YYYY-MM-DD" from the LOCAL clock.
// padStart(2, "0") turns "3" into "03" so it matches the date input's format.
function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");   // getMonth() starts at 0
  const day = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + month + "-" + day;
}

// Finders: each returns the matching record, or undefined if there is none.
function findSubject(id) { return subjects.find(s => s.id === id); }
function findProject(id) { return projects.find(p => p.id === id); }
function findMember(id) { return members.find(m => m.id === id); }

// The members who belong to one project (its roster).
function getRoster(projectId) {
  return members.filter(m => m.projectId === projectId);
}

// Makes one table cell <td> with plain text (numbers are turned into text).
function makeCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
}

// Adds a "nothing here" row to a table body. colspan = how many columns it spans.
function addEmptyTableRow(tbody, text, colspan) {
  const row = document.createElement("tr");
  const cell = makeCell(text);
  cell.colSpan = colspan;
  row.appendChild(cell);
  tbody.appendChild(row);
}

// A status word in a bordered box. The look differs by fill and weight, not only by color.
function makeBadge(status) {
  const badge = document.createElement("span");
  badge.textContent = status;
  badge.className = "badge badge-" + status.toLowerCase().replace(" ", "-");   // "To Do" -> "badge-to-do"
  return badge;
}
