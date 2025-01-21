const START = 'Start';
const STOP = 'Stop';
const STOPPING = 'Stopping...';
const CONNECTING = 'Connecting...';
const LOWER_INT_MISSING = 'Please enter the start integer.';
const UPPER_INT_MISSING = 'Please enter the end integer.';
const BAD_INTERVAL = 'Start integer must be less than the other.';
const CSRF_FAILURE = 'failed to read CSRF token';
const UNKNOWN_ERR  = 'An unknown error occurred: %s';
const CONN_ESTABLISHED = 'Connected to the end point';

/**
 * @type {EventSource} The `EventSource` object to interact with the server.
 */
let randIntStream;
/**
 * @type {boolean} Specifies whether the server was asked to stop sending
 * random integers.
 */
let randIntClosing = false;


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
    // Requesting the server to start the stream of integers...
    requestStreamStart();
  } else if (curState === STOP) {
    // Requesting the server to stop the stream of integers...
    requestStreamStop()
  } else {
    console.log(`expected '${START}' or '${STOP}' but got ${curState}`);
  }
}


/**
 * Requests the server to start streaming of random data.
 * ### Exceptions
 * * `CsrfTokenError`: fails to read CSRF token
 * @returns {undefined}
 */
function requestStreamStart() {
  // Checking interval...
  lowerInt = document.getElementById('start-int').value;
  if (lowerInt === '') {
    showAlert(LOWER_INT_MISSING);
    return;
  }
  upperInt = document.getElementById('end-int').value;
  if (upperInt === '') {
    showAlert(UPPER_INT_MISSING);
    return;
  }
  if (parseInt(lowerInt) >= parseInt(upperInt)) {
    showAlert(BAD_INTERVAL);
    return;
  }
  // Making the request...
  try {
    updatePageConnecting();
    //
    const URL = `/challenges/random-ints?lower-int=${lowerInt}&upperInt=${upperInt}`;
    randIntStream = new EventSource(URL);
    randIntStream.onmessage = onMsgReceived;
    randIntStream.onerror = onErrOccurred;
    randIntStream.onopen = onConnEstablished;
    //
    clearRandData();
  } catch(err) {
    showError(UNKNOWN_ERR.replace('%s', err))
    updatePageStopped();
  }
}


/**
 * Asynchronously requests the `megacodist.com` endpoint of producing
 * random integers to stop generating.
 */
async function requestStreamStop() {
  // Creating the POST request...
  const data = {
    'action': 'stop',
  }
  const csrfToken = getCsrfToken();
  if (csrfToken === null) {
    showError(CSRF_FAILURE);
    return;
  }
  let stopStreamReq = new Request(
    window.location.href,  // The URL of the current page
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify(data),
    }
  );
  // Requesting the server to stop the stream of random integers...
  updatePageStopping();
  randIntClosing = true;
  fetch(stopStreamReq)
    .then(response => {
      //
      if (!response.ok) {
        //
        return response.json().then(
          data => new Error(httpToStr(response.status, data.reason)))
      }
      //
      updatePageStopped();
      randIntStream.close();
    })
    .catch(err => {
      //
      showError(UNKNOWN_ERR.replace('%s', err));
      updatePageStarted();
      randIntClosing = false;
    })
}


/**
 * Triggered upon the arrival of any message from `megacodist.com`
 * random data stream endpoint.
 * @param {MessageEvent} event 
 */
function onMsgReceived(event) {
  addRandData(event.data);
}


/**
 * Triggered upon connection issues or server errors of `megacodist.com`
 * random data stream endpoint.
 * @param {MessageEvent} event 
 */
function onErrOccurred(event) {
  //
  if (randIntClosing) {
    // The server closed the SSE channel. So closing the SSE...
    updatePageStopped();
    randIntStream.close();
  }
  else {
    // An error occurred. Logging the error & reconnecting...
    console.error(event);
  }
}


/**
 * Triggered when this page is connected to the `megacodist.com` endpoint
 * for producing random integers stream.
 */
function onConnEstablished() {
  //
  updatePageStarted();
}


/**
 * Changes the page so that the user can feel the connection is establishing.
 */
function updatePageConnecting() {
  const startStopBtn = document.getElementById('start-stop');
  startStopBtn.textContent = CONNECTING;
  startStopBtn.disabled = true;
}


/**
 * Changes the page so that the user can feel the operation stopped.
 * @returns {undefined}
 */
function updatePageStopped() {
  const startStopBtn = document.getElementById('start-stop');
  startStopBtn.textContent = START;
  startStopBtn.disabled = false;
}


/**
 * Changes the page so that the user can feel the operation is stopping.
 * @returns {undefined}
 */
function updatePageStopping() {
  const startStopBtn = document.getElementById('start-stop');
  startStopBtn.textContent = STOPPING;
  startStopBtn.disabled = true;
}


/**
 * Changes the page so that the user can feel the operation is started.
 */
function updatePageStarted() {
  const startStopBtn = document.getElementById('start-stop');
  startStopBtn.textContent = STOP;
  startStopBtn.disabled = false;
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
 * Adds the provided data, of type `string`, to the random data `div` element.
 * @param {string} data 
 */
function addRandData(data) {
  // Creating new element for received data...
  const newData = document.createElement('div');
  newData.textContent = data;
  newData.className = 'rand-int'
  // Adding to the DOM...
  const randDataGrid = document.getElementById('rand-ints-grid');
  randDataGrid.prepend(newData);
}


/**
 * Clears all received random data from the server.
 */
function clearRandData() {
  //
  const randDataDiv = document.getElementById('rand-ints-grid');
  randDataDiv.innerHTML = '';
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
