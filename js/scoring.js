// scoring.js - Task scoring (Leader only) and the average score per member.

// Text shown on a task row, e.g. " | Score: 8/10 (Good work)". Empty if not scored.
function scoreText(task) {
  if (task.score === null) {
    return "";
  }
  return " | Score: " + task.score + "/10" + (task.comment !== "" ? " (" + task.comment + ")" : "");
}

// THE scoring rule: Leader only, task must be Done, never a task assigned to the Leader.
function canScore(task) {
  const assignee = findMember(task.assigneeId);
  return isActiveLeader() && task.status === "Done" && assignee !== undefined && assignee.role !== "Leader";
}

// Adds the score text and the Score / Edit Score button to a task row.
function addScoreControls(row, task) {
  if (task.score !== null) {
    const text = document.createElement("span");
    text.textContent = scoreText(task);
    row.appendChild(text);
  }
  if (canScore(task)) {
    const button = makeButton(task.score === null ? "Score" : "Edit Score", function () {
      scoreTask(task.id);
    }, task.score === null ? "score" : "edit");
    button.className = "leader-only";
    row.appendChild(button);
  }
}

// Runs when Score / Edit Score is clicked. Two prompts: the score, then the comment.
async function scoreTask(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!canScore(task)) {   // the button is hidden otherwise, but the rule is checked again
    showMessage("Only the Leader can score a Done task that belongs to someone else.", true);
    return;
  }

  const scoreAnswer = await showPromptDialog({
    title: "Score task",
    message: task.title,
    inputLabel: "Score (whole number from 1 to 10)",
    initialValue: task.score === null ? "" : task.score,
    inputType: "number",
    inputMode: "numeric",
    min: 1,
    max: 10,
    step: 1,
    confirmLabel: "Continue"
  });
  if (scoreAnswer === null) {
    return;
  }
  const score = Number(scoreAnswer.trim());
  if (scoreAnswer.trim() === "" || !Number.isInteger(score) || score < 1 || score > 10) {
    showMessage("Score must be a whole number from 1 to 10.", true);
    return;
  }

  const commentAnswer = await showPromptDialog({
    title: "Add a comment",
    message: "Optional feedback for " + task.title + ".",
    inputLabel: "Comment (up to 100 characters)",
    initialValue: task.comment,
    confirmLabel: "Save score"
  });
  if (commentAnswer === null) {
    return;
  }
  const comment = commentAnswer.trim();
  if (comment.length > 100) {
    showMessage("Comment must be 100 characters or fewer.", true);
    return;
  }

  task.score = score;
  task.comment = comment;
  saveData();
  renderAll();
  showMessage('Scored "' + task.title + '": ' + score + "/10.", false);
}

// Average of one member's scored tasks, as text for the roster.
function averageText(memberId) {
  const scored = tasks.filter(t => t.assigneeId === memberId && t.score !== null);
  if (scored.length === 0) {
    return "No scores yet";   // shown in the "Average score" column
  }
  let total = 0;
  for (let i = 0; i < scored.length; i++) {
    total += scored[i].score;
  }
  return (total / scored.length).toFixed(1) + " (" + scored.length + " scored)";
}

// Short score text for a table cell: "9/10 (comment)" or "-" when not scored.
function scoreShort(task) {
  if (task.score === null) {
    return "-";
  }
  return task.score + "/10" + (task.comment !== "" ? " (" + task.comment + ")" : "");
}
