"use strict";
//
//
//
var _a;
const STRS = {
    START: 'Start',
    STOP: 'Stop',
    STOPPING: 'Stopping...',
    LOWER_INT_MISSING: 'Please enter the start integer.',
    UPPER_INT_MISSING: 'Please enter the end integer.',
    BAD_INTERVAL: 'Start integer must be less than the end integer.',
    CSRF_FAILURE: 'Failed to read CSRF token',
    UNKNOWN_ERR: 'An unknown error occurred: %s',
    CONNECTING: 'Connecting to the endpoint %s/%s...',
    CONN_ESTABLISHED: 'Connected to the end point',
    CONN_FAILED: 'Failed to connect to the server.',
    MAX_RECONN_TRY_REACHED: 'Failed to connect after multiple tries.',
    ACCESS_FAILED: 'E2 - %s',
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
    // @ts-ignore
    #eventSource;
    /**
     * @type {boolean} Specifies whether the client asked to close of the
     * integer stream.
     */
    #clientClosing;
    /**
     * @type {number} Specifies the current iteration of trying to connect to
     * the server.
     */
    #nTry;
    #onIntReceived;
    #onConnecting;
    #onConnSuccess;
    #onConnClosed;
    #onErrOccurred;
    /**
     * Instatiates a new instance of the class and starts connecting.
     */
    constructor(endpoint, onIntReceived = (num) => { }, onConnecting = (n, max) => { }, onConnSuccess = () => { }, onConnClosed = () => { }, onErrOccurred = (msg) => { }) {
        // Setting callbacks...
        this.#onIntReceived = onIntReceived;
        this.#onConnecting = onConnecting;
        this.#onConnSuccess = onConnSuccess;
        this.#onConnClosed = onConnClosed;
        this.#onErrOccurred = onErrOccurred;
        // Connecting...
        this.#clientClosing = false;
        this.#nTry = 1;
        this.#onConnecting(this.#nTry, _a.MAX_TRIES);
        try {
            this.#eventSource = new EventSource(endpoint);
            this.#eventSource.onmessage = this.#evsrcOnMsg.bind(this);
            this.#eventSource.onerror = this.#evsrcOnErr.bind(this);
            this.#eventSource.onopen = this.#evsrcOnOpen.bind(this);
        }
        catch (err) {
            // @ts-ignore
            this.#onErrOccurred(err.toString());
        }
    }
    /**
     * Closes connection to the endpoint by sending the `req` AJAX request.
     * @param {Request} req
     * @returns {void}
     */
    close(req) {
        //
        this.#clientClosing = true;
        fetch(req)
            .then(response => {
            //
            if (!response.ok) {
                //
                return response.json().then(data => new Error(this.#httpToStr(response.status, data.reason)));
            }
            //
            this.#eventSource.close();
            this.#onConnClosed();
        })
            .catch(err => {
            //
            this.#onErrOccurred(err.toString());
            this.#clientClosing = false;
        });
    }
    /**
     *
     * @param {Event} event
     * @returns {void}
     */
    #evsrcOnOpen(event) {
        this.#onConnSuccess();
    }
    /**
     * @param {MessageEvent} event
     * @returns {void}
     */
    #evsrcOnMsg(event) {
        this.#onIntReceived(event.data);
    }
    /**
     *
     * @param {Event} event
     */
    #evsrcOnErr(event) {
        if (this.#eventSource.readyState === EventSource.CLOSED) {
            if (this.#clientClosing) {
                // The client successfully closed the connection...
                this.#onConnClosed();
            }
            else {
                //   The connection was closed unexpectedly (e.g., network issues,
                // server issues, or server closing the connection)...
                this.#onErrOccurred('Something closed the connection');
            }
            this.#nTry = 0;
            this.#eventSource.close();
        }
        else if (this.#eventSource.readyState === EventSource.CONNECTING) {
            // The connection try failed...
            if (this.#nTry >= _a.MAX_TRIES) {
                this.#onErrOccurred('failed to connect to the server');
            }
            else {
                this.#nTry++;
                this.#onConnecting(this.#nTry, _a.MAX_TRIES);
            }
        }
        else if (this.#eventSource.readyState == EventSource.OPEN) {
            // A rare condition happened...
        }
    }
    /**
     * Accepts an HTTP status code and a message to format the user-friendly
     * message.
     * @param {number} code The HTTP status code
     * @param {string} msg The message related to the status code or returned
     * by the server.
     * @returns {string}
     */
    #httpToStr(code, msg) {
        //
        const HTTP_MSG = 'HTTP %s %s';
        return HTTP_MSG.replace('%s', code.toString()).replace('%s', msg);
    }
    toString() {
        return `<RandIntStream object endpoint=${this.#eventSource.url}>`;
    }
}
_a = RandIntStream;
document.addEventListener('DOMContentLoaded', base_onDomLoaded);
function base_onDomLoaded() {
    // Adding click handler for `start-stop` button...
    let startStopBtn = document.getElementById('start-stop');
    if (!startStopBtn) {
        showElemAccessErr('start-stop');
        return;
    }
    startStopBtn.addEventListener('click', onStartStopClicked);
}
function onStartStopClicked() {
    const currState = document.getElementById('start-stop')?.textContent
        ?.trim();
    if (currState === undefined) {
        showElemAccessErr('start-stop');
        return;
    }
    if (currState === STRS.START) {
        // Requesting the server to start the stream of integers...
        requestStreamStart();
    }
    else if (currState === STRS.STOP) {
        // Requesting the server to stop the stream of integers...
        requestStreamStop();
    }
    else {
        console.log(`expected '${STRS.START}' or '${STRS.STOP}' but got ${currState}`);
    }
}
/**
 * Requests the server to start streaming of random data.
 * ### Exceptions
 * * `CsrfTokenError`: fails to read CSRF token
 * @returns {void}
 */
function requestStreamStart() {
    let msg;
    // Checking interval...
    // @ts-ignore
    let lowerInt = document.getElementById('start-int')?.value;
    if (lowerInt === undefined) {
        showElemAccessErr('start-int');
        return;
    }
    if (lowerInt === '') {
        showAlert(STRS.LOWER_INT_MISSING);
        return;
    }
    // @ts-ignore
    let upperInt = document.getElementById('end-int')?.value;
    if (upperInt === undefined) {
        showElemAccessErr('end-int');
        return;
    }
    if (upperInt === '') {
        showAlert(STRS.UPPER_INT_MISSING);
        return;
    }
    if (parseInt(lowerInt) >= parseInt(upperInt)) {
        showAlert(STRS.BAD_INTERVAL);
        return;
    }
    // Making the request to start the stream of integers...
    clearRandData();
    const ENDPOINT = `/challenges/random-ints?lower-int=${lowerInt}&upper-int=${upperInt}`;
    randIntStream = new RandIntStream(ENDPOINT, updatePageIntReceived, updatePageConnecting, updatePageConnSuccess, updatePageConnClosed, updatePageErrOccurred);
}
/**
 * Asynchronously requests the `megacodist.com` endpoint of producing
 * random integers to stop generating.
 */
async function requestStreamStop() {
    // Creating the POST request...
    const data = {
        'action': 'stop',
    };
    const csrfToken = getCsrfToken();
    if (csrfToken === null) {
        showError(STRS.CSRF_FAILURE);
        return;
    }
    let stopStreamReq = new Request(window.location.href, // The URL of the current page
    {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify(data),
    });
    // Requesting the server to stop the stream of random integers...
    updatePageStoppingBtn();
    // @ts-ignore
    randIntStream.close(stopStreamReq);
}
/**
 * Updates the page so user can see the newly-arrived integer.
 * @param {string} data The data (integer) received from the server.
 * @returns {void}
 */
function updatePageIntReceived(data) {
    addRandInt(data);
}
/**
 * Updates the page so user can understand connection was established.
 */
function updatePageConnSuccess() {
    const startStopBtn = document.getElementById('start-stop');
    if (startStopBtn === null) {
        showElemAccessErr('start-stop');
        return;
    }
    startStopBtn.textContent = STRS.STOP;
    // @ts-ignore
    startStopBtn.disabled = false;
}
/**
 * Updates the page so that the user can understand that the connection is
 * establishing.
 * @param {number} n
 * @param {number} max
 * @returns {void}
 */
function updatePageConnecting(n, max) {
    const startStopBtn = document.getElementById('start-stop');
    if (startStopBtn === null) {
        showElemAccessErr('start-stop');
        return;
    }
    startStopBtn.textContent = STRS.CONNECTING.replace('%s', n.toString())
        .replace('%s', max.toString());
    // @ts-ignore
    startStopBtn.disabled = true;
}
/**
 * Updates the page so user can understand connecting to the server failed
 * with a brief reason.
 * @param {string} err
 */
function updatePageConnFailed(err) {
    showError(STRS.UNKNOWN_ERR.replace('%s', err));
    updatePageStartBtn();
}
function updatePageConnClosed() {
    //
    updatePageStartBtn();
}
function updatePageErrOccurred(msg) {
    //
    showError(msg);
    updatePageStartBtn();
}
/**
 * Updates the page so that start-stop button becomes `Start`.
 * @returns {void}
 */
function updatePageStartBtn() {
    const startStopBtn = document.getElementById('start-stop');
    if (startStopBtn === null) {
        showElemAccessErr('start-stop');
        return;
    }
    startStopBtn.textContent = STRS.START;
    // @ts-ignore
    startStopBtn.disabled = false;
}
/**
 * Updates the page so that the start-stop button shows stopping.
 * @returns {void}
 */
function updatePageStoppingBtn() {
    const startStopBtn = document.getElementById('start-stop');
    if (startStopBtn === null) {
        showElemAccessErr('start-stop');
        return;
    }
    startStopBtn.textContent = STRS.STOPPING;
    // @ts-ignore
    startStopBtn.disabled = true;
}
/**
 * Adds the provided integer, of type `string`, to the random integers `div`
 * element.
 * @param {string} num
 * @returns {void}
 */
function addRandInt(num) {
    // Creating new element for received data...
    const newData = document.createElement('div');
    newData.textContent = num;
    newData.className = 'rand-int';
    // Adding to the DOM...
    const randDataGrid = document.getElementById('rand-ints-grid');
    if (randDataGrid === null) {
        showElemAccessErr('rand-ints-grid');
        return;
    }
    randDataGrid.prepend(newData);
}
/**
 * Clears all received random data from the server.
 */
function clearRandData() {
    //
    const randDataGrid = document.getElementById('rand-ints-grid');
    if (randDataGrid === null) {
        showElemAccessErr('rand-ints-grid');
        return;
    }
    randDataGrid.innerHTML = '';
}
/**
 * Returns CSRF token as a string or null it fails.
 * @returns {string|null}
 */
function getCsrfToken() {
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
function showElemAccessErr(id) {
    //
    let msg = STRS.ACCESS_FAILED.replace('%s', id);
    showError(msg);
}
/**
 * Shows the error to the user and logs it into the browser.
 * @param {string} message - The error message to be shown.
 * @returns {void}
 */
function showError(message) {
    console.error(message);
    showAlert(message, 'danger');
}
function showAlert(message, type = 'danger') {
    let alertContainer = document.getElementById('alert-container');
    if (alertContainer === null) {
        showElemAccessErr('alert-container');
        return;
    }
    // Create the alert HTML
    const alertHTML = `
      <div class="alert alert-${type} alert-dismissible fade show custom-alert" role="alert">
         ${message}
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
//# sourceMappingURL=script.js.map