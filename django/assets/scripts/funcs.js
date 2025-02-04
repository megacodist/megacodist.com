//
//
//
const STRS = {
    ACCESS_FAILED: 'E2 - %s',
};
/**
 * Returns CSRF token as a string or null it fails.
 * @returns {string|null}
 */
export function getCsrfToken() {
    let csrfToken = null;
    const keyValues = document.cookie.split(';');
    for (let i = 0; i < keyValues.length; i++) {
        const keyValue = keyValues[i].trim();
        if (!keyValue.startsWith('csrftoken')) {
            continue;
        }
        const eqSep = keyValue.indexOf('=');
        if (eqSep === -1) {
            continue;
        }
        csrfToken = keyValue.slice(eqSep + 1).trim();
        break;
    }
    return csrfToken;
}
/**
 * Shows and logs that the sprcified element was not found.
 * @param id The `id` or name of the element.
 */
export function showElemAccessErr(id) {
    //
    let msg = STRS.ACCESS_FAILED.replace('%s', id);
    showError(msg);
}
/**
 * Shows the error to the user and logs it into the browser.
 * @param {string} message - The error message to be shown.
 * @returns {void}
 */
export function showError(message) {
    console.error(message);
    showAlert(message, 'danger');
}
/**
 * Shows a message to the user.
 * @param {string} msg The message to be shown.
 * @param {string} type One of the values of `danger`, `warning`, and
 * `primary`.
 * @returns {void}
 */
export function showAlert(msg, type = 'danger') {
    let alertContainer = document.getElementById('alert-container');
    if (alertContainer === null) {
        showElemAccessErr('alert-container');
        return;
    }
    // Create the alert HTML
    const alertHTML = `
      <div class="alert alert-${type} alert-dismissible fade show custom-alert" role="alert">
         ${msg}
         <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>`;
    // Append the alert to the body (or a container)
    alertContainer.innerHTML = alertHTML;
    // Optionally remove the alert after 5 seconds
    setTimeout(() => {
        let alertBox = document.querySelector('.custom-alert');
        if (alertBox) {
            alertBox.remove();
        }
    }, 5000 // 5000 milliseconds = 5 seconds
    );
}
//# sourceMappingURL=funcs.js.map