//
//
//

const STRS = {
  START: 'Start',
  STOP: 'Stop',
  STOPPING: 'Stopping...',
  LOWER_INT_MISSING: 'Please enter the start integer.',
  UPPER_INT_MISSING: 'Please enter the end integer.',
  BAD_INTERVAL: 'Start integer must be less than the end integer.',
  CSRF_FAILURE: 'Failed to read CSRF token',
  UNKNOWN_ERR: 'An unknown error occurred: %s',
  CONN_ESTABLISHED: 'Connected to the end point',
  CONN_FAILED: 'Failed to connect to the server.',
  SERVER_CLOSED: 'The server closed the connection',
  MAX_RECONN_TRY_REACHED: 'Failed to connect after multiple tries.',
};


/**
 * @type {RandIntStream | null} The object for connecting to the server.
 */
let randIntStream = null;


class CsrfTokenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CsrfTokenError';
  }
}


class RandIntStream {
  static MAX_TRIES = 10;
  /**
   * @type {EventSource} The underlying `EventSource` object for getting
   * incoming stream.
   */
  #eventSource;
  /**
   * @type {boolean} Specifies whether the client asked the closure of the
   * integer stream.
   */
  #clientClosedSse;
  /**
   * @type {int} Specifies the current iteration of trying to connect to
   * the server.
   */
  #nTry;
  #endpoint;
  #onConnecting;
  #onConnFailed;
  #onConnSuccess;
  #onIntReceived;
  #onError;
  #onClientClosed;
  #onServerClosed

  /**
   * Instatiates a new instance of the class.
   */
  constructor(
      endpoint,
      onConnecting = (n, max) => {},
      onConnFailed = (err) => {},
      onConnSuccess = () => {},
      onIntReceived = (event) => {},
      onError = (event) => {},
      onClientClosed = () => {},
      onServerClosed = () => {},
    ) {
    this.#eventSource = null;
    this.#clientClosedSse = false;
    this.#nTry = 0;
    this.#endpoint = endpoint;
    this.#onConnecting = onConnecting;
    this.#onConnFailed = onConnFailed;
    this.#onConnSuccess = onConnSuccess;
    this.#onIntReceived = onIntReceived;
    this.#onError = onError;
    this.#onClientClosed = onClientClosed;
    this.#onServerClosed = onServerClosed;
  }

  /**
   * Tries to establish a connection with the endpoint.
   * @param {string} endpoint 
   */
  start() {
    // Making the request...
    try {
      this.#nTry = 1;
      this.#onConnecting(this.#nTry, RandIntStream.MAX_TRIES);
      //
      this.#eventSource = new EventSource(this.#endpoint);
      this.#eventSource.onmessage = this.#onMsgReceived.bind(this);
      this.#eventSource.onerror = this.#onErrOccurred.bind(this);
      this.#eventSource.onopen = this.#onOpen.bind(this);
    } catch(err) {
      this.#onConnFailed(err);
    }
  }

  /**
   * 
   * @param {Request} req 
   */
  close (req) {
    //
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
        clientClosedSse = false;
      })
  }


  /**
   * 
   * @param {Event} event 
   */
  #onOpen(event) {
    this.#onConnSuccess();
  }


  /**
   * @param {MessageEvent} event 
   */
  #onMsgReceived(event) {
    this.#onIntReceived(event.data);
  }


  /**
   * 
   * @param {Event} event 
   */
  #onErrOccurred(event) {
    if (this.#eventSource.readyState === EventSource.CLOSED) {
      if (this.#clientClosedSse) {
        // onClientClosed...
        this.#onClientClosed();
      }
      else {
        // onServerClosed...
        this.#onServerClosed();
      }
      this.#nTry = 0;
      this.#eventSource.close();
    }
    else if (randIntStream.readyState === EventSource.CONNECTING) {
      // onConnectionTries...
      if (nConnectionTry >= RandIntStream.MAX_TRIES) {
        this.#onConnFailed(event);
      } else {
        nConnectionTry++;
        this.#onConnecting(this.#nTry, RandIntStream.MAX_TRIES);
      }
    }
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
  // Making the request to start the stream of integers...
    clearRandData();
    const ENDPOINT = `/challenges/random-ints?lower-int=${lowerInt}&upper-int=${upperInt}`;
    randIntStream = new RandIntStream(
      ENDPOINT,
      updatePageConnecting,
      updatePageConnFailed,
      updatePageConnSuccess,
      updatePageIntReceived,
      onErrOccurred,
      updatePageClientClosed,
      updatePageServerClosed,);
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
  updatePageStoppingBtn();
  randIntStream.close(stopStreamReq);
  clientClosedSse = true;
}


/**
 * Updates the page so user can see the newly-arrived integer.
 * @param {string} data The data (integer) received from the server.
 */
function updatePageIntReceived(data) {
  addRandInt(data);
}


/**
 * Triggered upon connection issues or server errors of `megacodist.com`
 * random data stream endpoint.
 * @param {MessageEvent} event 
 */
function onErrOccurred(event) {
  if (randIntStream.readyState === EventSource.CLOSED) {
    if (clientClosedSse) {
      // onClientClosed...
      updatePageStartBtn();
      randIntStream.close();
      nConnectionTry = 0;
    }
    else {
      // onServerClosed...
      randIntStream.close();
      errMsg = UNKNOWN_ERR.replace('%s', event.data);
      showError(errMsg);
      updatePageStartBtn();
    }
  }
  else if (randIntStream.readyState === EventSource.CONNECTING) {
    // onConnectionTries...
    if (nConnectionTry >= MAX_RECONN_TRY) {
      showError(CONN_FAILED);
      updatePageStartBtn()
    } else {
      nConnectionTry++;
      updatePageConnecting();
    }
  }
}


/**
 * Updates the page so user can understand connection was established.
 */
function updatePageConnSuccess() {
  const startStopBtn = document.getElementById('start-stop');
  startStopBtn.textContent = STOP;
  startStopBtn.disabled = false;
}


/**
 * Updates the page so that the user can feel the connection is establishing.
 * @param {int} n 
 * @param {int} max 
 */
function updatePageConnecting(n, max) {
  const startStopBtn = document.getElementById('start-stop');
  startStopBtn.textContent = CONNECTING.replace('%s', n).replace('%s', max);
  startStopBtn.disabled = true;
}


/**
 * Updates the page so user can understand connecting to the server failed
 * with a brief reason.
 * @param {*} err 
 */
function updatePageConnFailed(err) {
  showError(UNKNOWN_ERR.replace('%s', err));
  updatePageStartBtn();
}


function updatePageClientClosed() {
  //
  updatePageStartBtn();
}


function updatePageServerlosed() {
  //
  showError(SERVER_CLOSED);
  updatePageStartBtn();
}


/**
 * Updates the page so that start-stop button becomes `Start`.
 * @returns {undefined}
 */
function updatePageStartBtn() {
  const startStopBtn = document.getElementById('start-stop');
  startStopBtn.textContent = START;
  startStopBtn.disabled = false;
}


/**
 * Updates the page so that the start-stop button shows stopping.
 * @returns {undefined}
 */
function updatePageStoppingBtn() {
  const startStopBtn = document.getElementById('start-stop');
  startStopBtn.textContent = STOPPING;
  startStopBtn.disabled = true;
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
 * Adds the provided integer, of type `string`, to the random integers `div`
 * element.
 * @param {string} data 
 */
function addRandInt(data) {
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
      alertBox = document.querySelector('.custom-alert');
      if (alertBox) {
        alertBox.remove();
      }
    },
    5000 // 5000 milliseconds = 5 seconds
  );
}
