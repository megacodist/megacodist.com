const START = 'Start';
const STOP = 'Stop';
const CSRF_FAILURE = 'failed to read CSRF token';
const UNKNOWN_ERR  = 'An unknown error occurred: %s';
const HTTP_ERROR = 'HTTP %s\n%s';

let randIntStream;
let randomIntStream;


class CsrfTokenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CsrfTokenError';
  }
}


document.addEventListener('DOMContentLoaded', onDomLoaded);


function onDomLoaded() {
  // Adding click handler for `start-stop` button...
  document.getElementById('start-stop').addEventListener(
    'click',
    onStartStopClicked
  );
}


function onStartStopClicked() {
  const curState = document.getElementById('pause-resume').textContent.trim();
  alert(curState);
  if (curState === START) {
    // Requesting 
    try {
      requestStreamStart();
    } catch (err) {
      if (err instanceof CsrfTokenError) {
        showError(err.message);
      } else {
        showError(UNKNOWN_ERR.replace('%s', err.message))
      }
      changeGuiStoped();
    }
  } else if (curState === STOP) {
    //
  } else {
    console.log(`expected '${START}' or '${STOP}' but got ${curState}`);
  }
}


/**
 * Request the server to start streaming of random data.
 * ### Exceptions
 * * `CsrfTokenError`: fails to read SCRF token
 * @returns {undefined}
 */
async function requestStreamStart() {
  // Informing the server...
  const data = {
    'action': 'start',
  }
  const csrfToken = getCsrfToken();
  if (csrfToken === null) {
    showError();
    throw new CsrfTokenError(CSRF_FAILURE);
  }
  // Informing the user...
  updateGuiRpsStopped();
  // Requesting the server to initiate the stream of random integers...
  let startStreamReq = new Request(
    '/',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify(data),
    }
  );
  fetch(startStreamReq)
    .then(response => {
      if (!response.ok) {
        // Reading the body of the response if it's not successful...
        return response.text().then(text => {
          let msg = sprintf()
          throw new Error(``)
        })
      }
      // Reading SSE...
      randIntStream = new EventSource(window.location.href)  // The URL of the current page
      randIntStream.onmessage = event => {}
      randIntStream.onerror = err => {}
      randIntStream.onopen = () => {}
    })


  try {
    let startStreamResp = await fetch(startStreamReq);
    if (!startStreamResp.ok) {
      throw new Error(UNKNOWN_ERR.replace('%s', ))
    }
  } catch (err) {
    //
  }
}


function changeGuiStarted() {
  document.getElementById('start-stop').textContent = STOP;
}


function changeGuiStoped() {
  document.getElementById('start-stop').textContent = START;
}


/**
 * @function getCsrfToken
 * @returns {string|null} Returns a string or null.
 */
function getCsrfToken() {
  let csrfToken = null;
  const keyValues = document.cookie.split(';')
  for (let i =0; i < keyValues.length; i++) {
    const keyValue = keyValues[i].trim()
    if (!keyValue.startsWith('csrftoken')) {
      continue;
    }
    const eqSep = keyValue.indexOf('=')
    if (eqSep === -1) {
      continue;
    }
    csrfToken = keyValue.slice(eqSep + 1).trim()
    break;
  }
  return csrfToken;
}


/**
 * Shows the error to the user and logs it into the browser.
 * @param {message} message - The message to show. 
 */
function showError(message) {
  console.error(message);
  showAlert(message, 'danger');
}


function showAlert(message, type = 'danger') {
  // Create the alert HTML
  const alertHTML = `
    <div class="alert alert-${type} alert-dismissible fade show custom-alert" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
  // Append the alert to the body (or a container)
  document.getElementById('alert-container').innerHTML = alertHTML;
  // Optionally remove the alert after 5 seconds
  setTimeout(
    () => {
      document.querySelector('.custom-alert').remove();
    },
    5000 // 5000 milliseconds = 5 seconds
  );
}
