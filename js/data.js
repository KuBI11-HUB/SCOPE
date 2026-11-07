// data.js - keeps the app's data and saves/loads it in localStorage.

// The four lists live in memory while the page is open.
// They are declared with "let" (not "const") because loadData() and
// the cascade delete replace them with new arrays.
// app.js can use them because both files share the same global scope.
let subjects = [];
let projects = [];
let members = [];
let tasks = [];
let activePerson = null;   // id of the person chosen in "Acting as" (later slice)

// The names used inside localStorage. Keep them in one place so we never mistype them.
const KEY_SUBJECTS = "scope_subjects";
const KEY_PROJECTS = "scope_projects";
const KEY_MEMBERS = "scope_members";
const KEY_TASKS = "scope_tasks";
const KEY_ACTIVE = "scope_activePerson";

// Reads one list from localStorage. Returns [] if nothing is saved yet.
function readList(key) {
  const text = localStorage.getItem(key);   // localStorage only stores text
  if (text === null) {
    return [];
  }
  try {
    return JSON.parse(text);                // turn the saved text back into an array
  } catch (error) {
    return [];                              // saved text was damaged: start empty instead of crashing
  }
}

// Loads everything from localStorage into the variables above.
function loadData() {
  subjects = readList(KEY_SUBJECTS);
  projects = readList(KEY_PROJECTS);
  members = readList(KEY_MEMBERS);
  tasks = readList(KEY_TASKS);
  activePerson = localStorage.getItem(KEY_ACTIVE);   // null if nothing saved
}

// Saves everything. Call this after EVERY change to the data.
function saveData() {
  localStorage.setItem(KEY_SUBJECTS, JSON.stringify(subjects));   // array -> text
  localStorage.setItem(KEY_PROJECTS, JSON.stringify(projects));
  localStorage.setItem(KEY_MEMBERS, JSON.stringify(members));
  localStorage.setItem(KEY_TASKS, JSON.stringify(tasks));
  if (activePerson === null) {
    localStorage.removeItem(KEY_ACTIVE);
  } else {
    localStorage.setItem(KEY_ACTIVE, activePerson);
  }
}

// Makes a unique id like "subject_1731000000000_482".
// Time + a random number so two ids made in the same millisecond still differ.
function makeId(prefix) {
  return prefix + "_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}