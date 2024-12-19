const START = 'Start';
const STOP = 'Stop';
const STOPPING = 'Stopping...';
const CSRF_FAILURE = 'failed to read CSRF token';
const UNKNOWN_ERR  = 'An unknown error occurred: %s';
const CONN_ESTABLISHED = 'Connected to the end point';

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
  const curState = document.getElementById('start-stop').textContent.trim();
  if (curState === START) {
    // Requesting 
    requestStreamStart()
      .catch(function (err) {
        //
        if (err instanceof CsrfTokenError) {
          showError(CSRF_FAILURE);
        } else {
          showError(UNKNOWN_ERR.replace('%s', err.message))
        }
        changeGuiStopped();
      })
  } else if (curState === STOP) {
    //
  } else {
    console.log(`expected '${START}' or '${STOP}' but got ${curState}`);
  }
}


/**
 * Asynchronously request the server to start streaming of random data.
 * ### Exceptions
 * * `CsrfTokenError`: fails to read CSRF token
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
  changeGuiStarted();
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
        return response.text().then(errMsg => {
          throw new Error(httpToStr(response.status, errMsg))
        })
      }
      // Reading SSE...
      randIntStream = new EventSource('/challenges/random-data/'); // The URL of the current page
      randIntStream.onmessage = onMsgReceived;
      randIntStream.onerror = onErrOccurred;
      randIntStream.onopen = onConnEstablished;
    })
  .catch(err => {
    //
    let unknownErrMsg = UNKNOWN_ERR.replace('%s', err)
    showError(unknownErrMsg);
    changeGuiStopped();
  })
}


/**
 * Asynchronously requests the `megacodist.com` endpoint of producing
 * random integers to stop generating.
 */
async function requestStreamStop() {
  // Informing the server...
  const data = {
    'action': 'stop',
  }
  const csrfToken = getCsrfToken();
  if (csrfToken === null) {
    showError(CSRF_FAILURE);
    return;
  }
  // Informing the user...
  changeGuiStopping();
  // Requesting the server to initiate the stream of random integers...
  let stopStreamReq = new Request(
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
  fetch(stopStreamReq)
    .then(response => {
      //
      if (!response.ok) {
        //
        return response.text().then(
          errMsg => new Error(httpToStr(response.status, errMsg)))
      }
      //
      changeGuiStopped();
    })
    .catch(err => {
      //
      showError(UNKNOWN_ERR.replace('%s', err))
    })
}


/**
 * Triggered when this page is connected to the `megacodist.com` endpoint
 * for producing random integers stream.
 */
function onConnEstablished() {
  //
  console.log(CONN_ESTABLISHED)
}


/**
 * Triggered upon the arrival of any message from `megacodist.com`
 * random data stream endpoint.
 * @param {MessageEvent} event 
 */
function onMsgReceived(event) {
  //
  const newIntDiv = document.createElement('div')
  newIntDiv.textContent = event.data
  document.getElementById('rand-ints').appendChild(newIntDiv)
}


/**
 * Triggered upon connection issues or server errors of `megacodist.com`
 * random data stream endpoint.
 * @param {MessageEvent} event 
 */
function onErrOccurred(event) {
  //
  console.error(event);
  changeGuiStopped();
}


/**
 * Changes the page so that the user can feel the operation started.
 * @returns {undefined}
 */
function changeGuiStarted() {
  document.getElementById('start-stop').textContent = STOP;
}


/**
 * Changes the page so that the user can feel the operation stopped.
 * @returns {undefined}
 */
function changeGuiStopped() {
  document.getElementById('start-stop').textContent = START;
}


/**
 * Changes the page so that the user can feel the operation is stopping.
 * @returns {undefined}
 */
function changeGuiStopping() {
  document.getElementById('start-stop').textContent = STOPPING;
}


/**
 * Accepts an HTTP status code and a message to format the user-friendly
 * message.
 * @param {int} code The HTTP status code
 * @param {string} msg The message related to the status code or returned
 * by the server.
 * @returns {string}
 */
function httpToStr(code, msg) {
  //
  const HTTP_MSG = 'HTTP %s\n%s';
  return HTTP_MSG.replace('%s', code).replace('%s', msg)
}


/**
 * Returns CSRF token as a string or null it fails.
 * @returns {string|null}
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
 * @param {string} message - The error message to be shown.
 * @returns {undefined}
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
