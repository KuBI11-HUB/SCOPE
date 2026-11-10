// dialogs.js - accessible in-app confirmation dialogs.

function showConfirmDialog(options) {
  const dialog = document.getElementById("app-dialog");
  const eyebrow = document.querySelector(".app-dialog__eyebrow");
  const title = document.getElementById("app-dialog-title");
  const message = document.getElementById("app-dialog-message");
  const inputGroup = document.getElementById("app-dialog-input-group");
  const inputLabel = document.getElementById("app-dialog-input-label");
  const input = document.getElementById("app-dialog-input");
  const cancelButton = document.getElementById("app-dialog-cancel");
  const confirmButton = document.getElementById("app-dialog-confirm");
  const previousFocus = document.activeElement;
  const expectedValue = options.expectedValue || "";

  eyebrow.textContent = "Confirm action";
  title.textContent = options.title;
  message.textContent = options.message;
  setButtonLabel(cancelButton, options.cancelLabel || "Cancel");
  setButtonLabel(confirmButton, options.confirmLabel || "Confirm");
  confirmButton.classList.toggle("app-dialog__confirm--danger", options.destructive === true);
  inputGroup.hidden = expectedValue === "";
  inputLabel.textContent = options.inputLabel || "";
  input.value = "";
  confirmButton.disabled = expectedValue !== "";
  dialog.returnValue = "";

  return new Promise(function (resolve) {
    function cleanup() {
      confirmButton.removeEventListener("click", accept);
      cancelButton.removeEventListener("click", cancel);
      dialog.removeEventListener("click", cancelOnBackdrop);
      dialog.removeEventListener("cancel", dismissOnEscape);
      input.removeEventListener("input", validateInput);
    }

    function finish(confirmed) {
      cleanup();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      }
      resolve(confirmed);
    }

    function accept() {
      if (!confirmButton.disabled) {
        dialog.close("confirm");
        finish(true);
      }
    }

    function cancel() {
      dialog.close("cancel");
      finish(false);
    }

    function cancelOnBackdrop(event) {
      if (event.target === dialog) {
        cancel();
      }
    }

    function dismissOnEscape(event) {
      event.preventDefault();
      cancel();
    }

    function validateInput() {
      confirmButton.disabled = input.value.trim() !== expectedValue;
    }

    confirmButton.addEventListener("click", accept);
    cancelButton.addEventListener("click", cancel);
    dialog.addEventListener("click", cancelOnBackdrop);
    dialog.addEventListener("cancel", dismissOnEscape);
    input.addEventListener("input", validateInput);
    try {
      dialog.showModal();
    } catch (error) {
      cleanup();
      throw error;
    }

    if (expectedValue !== "") {
      input.focus();
    } else {
      cancelButton.focus();
    }
  });
}

function showPromptDialog(options) {
  const dialog = document.getElementById("app-dialog");
  const eyebrow = document.querySelector(".app-dialog__eyebrow");
  const title = document.getElementById("app-dialog-title");
  const message = document.getElementById("app-dialog-message");
  const inputGroup = document.getElementById("app-dialog-input-group");
  const inputLabel = document.getElementById("app-dialog-input-label");
  const input = document.getElementById("app-dialog-input");
  const cancelButton = document.getElementById("app-dialog-cancel");
  const confirmButton = document.getElementById("app-dialog-confirm");
  const previousFocus = document.activeElement;

  eyebrow.textContent = "Edit details";
  title.textContent = options.title;
  message.textContent = options.message || "";
  inputGroup.hidden = false;
  inputLabel.textContent = options.inputLabel;
  input.type = options.inputType || "text";
  input.inputMode = options.inputMode || "";
  input.min = options.min === undefined ? "" : options.min;
  input.max = options.max === undefined ? "" : options.max;
  input.step = options.step === undefined ? "" : options.step;
  input.value = options.initialValue === undefined ? "" : options.initialValue;
  setButtonLabel(cancelButton, options.cancelLabel || "Cancel");
  setButtonLabel(confirmButton, options.confirmLabel || "Save");
  confirmButton.disabled = false;
  confirmButton.classList.remove("app-dialog__confirm--danger");
  dialog.returnValue = "";

  return new Promise(function (resolve) {
    function cleanup() {
      confirmButton.removeEventListener("click", accept);
      cancelButton.removeEventListener("click", cancel);
      dialog.removeEventListener("click", cancelOnBackdrop);
      dialog.removeEventListener("cancel", dismissOnEscape);
      input.removeEventListener("keydown", submitOnEnter);
    }

    function finish(value) {
      cleanup();
      input.type = "text";
      input.inputMode = "";
      input.min = "";
      input.max = "";
      input.step = "";
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      }
      resolve(value);
    }

    function accept() {
      dialog.close("confirm");
      finish(input.value);
    }

    function cancel() {
      dialog.close("cancel");
      finish(null);
    }

    function cancelOnBackdrop(event) {
      if (event.target === dialog) {
        cancel();
      }
    }

    function dismissOnEscape(event) {
      event.preventDefault();
      cancel();
    }

    function submitOnEnter(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        accept();
      }
    }

    confirmButton.addEventListener("click", accept);
    cancelButton.addEventListener("click", cancel);
    dialog.addEventListener("click", cancelOnBackdrop);
    dialog.addEventListener("cancel", dismissOnEscape);
    input.addEventListener("keydown", submitOnEnter);
    try {
      dialog.showModal();
    } catch (error) {
      cleanup();
      input.type = "text";
      input.inputMode = "";
      input.min = "";
      input.max = "";
      input.step = "";
      throw error;
    }
    input.focus();
    if (input.type !== "number") {
      input.select();
    }
  });
}
