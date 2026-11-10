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

const UI_ICONS = {
  folder: ["M3 7.5h7l2 2H21v9.75H3z", "M3 7.5V6.25A1.25 1.25 0 0 1 4.25 5h4.5l2 2H19"],
  list: ["M9 6h11", "M9 12h11", "M9 18h11", "M4 6h.01", "M4 12h.01", "M4 18h.01"],
  details: ["M7 3h7l5 5v13H7z", "M14 3v5h5", "M10 12h6", "M10 16h6"],
  checkList: ["M9 6h11", "M9 12h11", "M9 18h11", "m3.5 6 1 1 2-2", "m3.5 12 1 1 2-2", "m3.5 18 1 1 2-2"],
  plus: ["M12 5v14", "M5 12h14"],
  search: ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z", "m17 17 4 4"],
  filter: ["M4 6h16", "M7 12h10", "M10 18h4"],
  close: ["M18 6 6 18", "m6 6 12 12"],
  trash: ["M3 6h18", "M8 6V4h8v2", "m19 6-1 14H6L5 6", "M10 11v5", "M14 11v5"],
  edit: ["M12 20h9", "M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"],
  open: ["M14 4h6v6", "M20 4 11 13", "M18 13v6H5V6h6"],
  personPlus: ["M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M19 8v6", "M16 11h6"],
  leader: ["M12 3 14.8 8.7 21 9.6l-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z"],
  score: ["M3 3v18h18", "m7 14 4-4 4 3 6-7"],
  reset: ["M3 12a9 9 0 1 0 2.6-6.4L3 8", "M3 3v5h5"],
  confirm: ["m5 12 4 4L19 6"]
};

function createIcon(name) {
  const paths = UI_ICONS[name];
  if (!paths) {
    throw new Error('Unknown UI icon "' + name + '".');
  }

  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("class", "ui-icon");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "1.7");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("focusable", "false");

  for (let i = 0; i < paths.length; i++) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", paths[i]);
    icon.appendChild(path);
  }
  return icon;
}

function setButtonIcon(button, name) {
  const label = button.querySelector(".button-label");
  const labelText = label ? label.textContent : button.textContent;
  if (!button.querySelector(".ui-icon")) {
    button.insertBefore(createIcon(name), button.firstChild);
  }
  setButtonLabel(button, labelText);
  button.classList.add("has-icon");
}

function setButtonLabel(button, text) {
  const icon = button.querySelector(".ui-icon");
  let label = button.querySelector(".button-label");
  if (!label) {
    label = document.createElement("span");
    label.className = "button-label";
  }
  button.replaceChildren();
  if (icon) {
    button.appendChild(icon);
  }
  button.appendChild(label);
  label.textContent = text;
}

function initializeButtonIcons() {
  const buttons = document.querySelectorAll("button[data-icon]");
  for (let i = 0; i < buttons.length; i++) {
    setButtonIcon(buttons[i], buttons[i].dataset.icon);
  }
}

// Makes a button that runs onClick when clicked.
// type = "button" so it never submits a form by accident.
function makeButton(text, onClick, iconName) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  if (iconName) {
    setButtonIcon(button, iconName);
  }
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
