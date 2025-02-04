/**
 * This module provides browser compatibility checks for different
 * ECMAScript 2022 features.
 * @module checkers
 */

import MSGS from '@utils/msgs.json'


/**
 * Returns without any problem if the browser supports private class fields,
 * otherwise informs the user about the incompatibility, logs the error, and
 * usually throws `SyntaxError` but other errors are also possible.
 * @returns {void}
 */
export function supportsPrivateFields(): void {
    try {
        class Test {
            #privateField = 42;
        }
    // Private class fields are supported. Going on...
    } catch (error) {
        if (error instanceof SyntaxError) {
            // Private class fields are not supported in the browser.
            // Showing a message to the user to update it...
            alert(MSGS.errors.outdatedBrowser);
            console.error(MSGS.errors.privateClassFieldsErr)
        } else {
            // Handling unexpected errors...
            alert(MSGS.errors.errTryLater);
        }
        throw error;
    }
}
