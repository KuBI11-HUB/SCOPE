// feedback.js - live messages under a field while the user types.

const FEEDBACK_FIELDS = ["subject-name", "project-name", "member-name", "task-title"];

// Returns an error text for what is typed so far, or "" if it is fine.
function checkField(fieldId, value) {
  if (value === "") {
    return "This field is required.";
  }
  if (fieldId === "subject-name") {
    return checkSubjectName(value, null);   // reuses the submit-time rule (duplicates)
  }
  if (fieldId === "member-name") {
    return checkMemberName(value);
  }
  return "";
}

// Finds the small message box under an input, or creates it the first time.
function getFeedbackBox(input) {
  let box = document.getElementById(input.id + "-feedback");
  if (box === null) {
    box = document.createElement("small");
    box.id = input.id + "-feedback";
    box.className = "field-feedback";
    box.setAttribute("aria-live", "polite");
    input.insertAdjacentElement("afterend", box);
  }
  return box;
}

// Runs on every keystroke in the fields above.
function showFieldFeedback(event) {
  const input = event.target;
  getFeedbackBox(input).textContent = checkField(input.id, input.value.trim());
}

function attachFieldFeedback() {
  for (let i = 0; i < FEEDBACK_FIELDS.length; i++) {
    document.getElementById(FEEDBACK_FIELDS[i]).addEventListener("input", showFieldFeedback);
  }
}

// Empties every feedback message (after a save or redraw the old message is stale).
function clearFieldFeedback() {
  const boxes = document.querySelectorAll(".field-feedback");
  for (let i = 0; i < boxes.length; i++) {
    boxes[i].textContent = "";
  }
}
