/**
 * 
 */

// Checking availability of class private fields...
import {supportsPrivateFields} from '@utils/checkers';
supportsPrivateFields();

// Importing required stuff...
import {
   getCsrfToken, showAlert, showElemAccessErr, showError
} from '@utils/funcs'


(function() {
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
   let randIntStream: RandIntStream | null = null;
   
   
   class RandIntStream {
      static MAX_TRIES = 10;
      /**
       * @type {EventSource} The underlying `EventSource` object for getting
       * incoming stream.
       */
      // @ts-ignore
      #eventSource: EventSource;
      /**
       * @type {boolean} Specifies whether the client asked to close of the
       * integer stream.
       */
      #clientClosing: boolean;
      /**
       * @type {number} Specifies the current iteration of trying to connect to
       * the server.
       */
      #nTry: number;
      #onIntReceived: (num: string) => void;
      #onConnecting: (n: number, max: number) => void;
      #onConnSuccess: () => void;
      #onConnClosed: () => void;
      #onErrOccurred: (msg: string) => void;
   
      /**
       * Instatiates a new instance of the class and starts connecting.
       */
      constructor(
            endpoint: string,
            onIntReceived = (num: string) => {},
            onConnecting = (n: number, max: number) => {},
            onConnSuccess = () => {},
            onConnClosed = () => {},
            onErrOccurred = (msg: string) => {},
         ) {
         // Setting callbacks...
         this.#onIntReceived = onIntReceived;
         this.#onConnecting = onConnecting;
         this.#onConnSuccess = onConnSuccess;
         this.#onConnClosed = onConnClosed;
         this.#onErrOccurred = onErrOccurred;
         // Connecting...
         this.#clientClosing = false;
         this.#nTry = 1;
         this.#onConnecting(this.#nTry, RandIntStream.MAX_TRIES);
         try {
            this.#eventSource = new EventSource(endpoint);
            this.#eventSource.onmessage = this.#evsrcOnMsg.bind(this);
            this.#eventSource.onerror = this.#evsrcOnErr.bind(this);
            this.#eventSource.onopen = this.#evsrcOnOpen.bind(this);
         } catch(err: unknown) {
            // @ts-ignore
            this.#onErrOccurred(err.toString());
         }
      }
   
      /**
       * Closes connection to the endpoint by sending the `req` AJAX request.
       * @param {Request} req 
       * @returns {void}
       */
      close (req: Request): void {
         //
         this.#clientClosing = true;
         fetch(req)
            .then(response => {
               //
               if (!response.ok) {
                  //
                  return response.json().then(
                     data => new Error(this.#httpToStr(response.status, data.reason)))
               }
               //
               this.#eventSource.close();
               this.#onConnClosed();
            })
            .catch(err => {
               //
               this.#onErrOccurred(err.toString())
               this.#clientClosing = false;
            })
      }
   
   
      /**
       * 
       * @param {Event} event 
       * @returns {void}
       */
      #evsrcOnOpen(event: Event): void {
         this.#onConnSuccess();
      }
   
   
      /**
       * @param {MessageEvent} event 
       * @returns {void}
       */
      #evsrcOnMsg(event: MessageEvent): void {
         this.#onIntReceived(event.data);
      }
   
   
      /**
       * 
       * @param {Event} event 
       */
      #evsrcOnErr(event: Event): void {
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
            if (this.#nTry >= RandIntStream.MAX_TRIES) {
               this.#onErrOccurred('failed to connect to the server');
            } else {
               this.#nTry++;
               this.#onConnecting(this.#nTry, RandIntStream.MAX_TRIES);
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
      #httpToStr(code: number, msg: string): string {
         //
         const HTTP_MSG = 'HTTP %s %s';
         return HTTP_MSG.replace('%s', code.toString()).replace('%s', msg);
      }
   
      toString(): string {
         return `<RandIntStream object endpoint=${this.#eventSource.url}>`
      }
   }
   
   
   document.addEventListener('DOMContentLoaded', base_onDomLoaded);
   
   
   function base_onDomLoaded() {
      // Adding click handler for `start-stop` button...
      let startStopBtn = document.getElementById('start-stop') as 
         HTMLButtonElement | null;
      if (!startStopBtn) {
         showElemAccessErr('start-stop');
         return;
      }
      startStopBtn.addEventListener(
         'click',
         onStartStopClicked
      );
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
      } else if (currState === STRS.STOP) {
         // Requesting the server to stop the stream of integers...
         requestStreamStop()
      } else {
         console.log(`expected '${STRS.START}' or '${STRS.STOP}' but got ${currState}`);
      }
   }
   
   
   /**
    * Requests the server to start streaming of random data.
    * @returns {void}
    */
   function requestStreamStart(): void {
      let msg: string;
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
      randIntStream = new RandIntStream(
         ENDPOINT,
         updatePageIntReceived,
         updatePageConnecting,
         updatePageConnSuccess,
         updatePageConnClosed,
         updatePageErrOccurred,);
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
         showError(STRS.CSRF_FAILURE);
         return;
      }
      let stopStreamReq = new Request(
         window.location.href,   // The URL of the current page
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
      // @ts-ignore
      randIntStream.close(stopStreamReq);
   }
   
   
   /**
    * Updates the page so user can see the newly-arrived integer.
    * @param {string} data The data (integer) received from the server.
    * @returns {void}
    */
   function updatePageIntReceived(data: string): void {
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
   function updatePageConnecting(n: number, max: number): void {
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
   function updatePageConnFailed(err: string) {
      showError(STRS.UNKNOWN_ERR.replace('%s', err));
      updatePageStartBtn();
   }
   
   
   function updatePageConnClosed() {
      //
      updatePageStartBtn();
   }
   
   
   function updatePageErrOccurred(msg: string): void {
      //
      showError(msg);
      updatePageStartBtn();
   }
   
   
   /**
    * Updates the page so that start-stop button becomes `Start`.
    * @returns {void}
    */
   function updatePageStartBtn(): void {
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
   function updatePageStoppingBtn(): void {
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
   function addRandInt(num: string): void {
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
})();
