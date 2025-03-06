//
//
//
import { showElemAccessErr } from '/assets/scripts/funcs.js';
(function () {
    class BadThemeError extends Error {
        constructor(message) {
            super(message);
            this.name = 'BadThemeError';
        }
    }
    const STRS = {
        BAD_THEME: 'Invalid theme %s',
    };
    document.addEventListener('DOMContentLoaded', onDomLoaded);
    function onDomLoaded() {
        // Adding click handler for `theme-toggler` button...
        let themeToggler = document.getElementById('theme-toggler');
        if (!themeToggler) {
            showElemAccessErr('theme-toggler');
            return;
        }
        themeToggler.addEventListener('click', onThemeTogglerClicked);
    }
    /**
     * Returns the preferred theme which is the first available value in the
     * following order:
     * 1. The previous user choice.
     * 2. The browser theme choice.
     * 3. The light theme.
     * @returns {string}
     */
    function getPreferredTheme() {
        const SAVED_THEME = localStorage.getItem('theme');
        if (SAVED_THEME) {
            return SAVED_THEME;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ?
            'dark' : 'light';
    }
    ;
    /**
     * Changes theme of the page. It throws `BadThemeError`, if `theme` value
     * is unknown.
     * @param theme
     * @returns
     */
    function switchTheme(theme) {
        const ROOT = document.documentElement;
        //
        let darkModeSvg = document.getElementById('dark-mode-icon');
        if (!darkModeSvg) {
            showElemAccessErr('dark-mode-icon');
            return;
        }
        //
        let lightModeSvg = document.getElementById('light-mode-icon');
        if (!lightModeSvg) {
            showElemAccessErr('light-mode-icon');
            return;
        }
        switch (theme) {
            case 'light':
                ROOT.setAttribute('data-theme', theme);
                darkModeSvg.style.display = 'block';
                lightModeSvg.style.display = 'none';
                localStorage.setItem('theme', theme);
                break;
            case 'dark':
                ROOT.setAttribute('data-theme', theme);
                darkModeSvg.style.display = 'none';
                lightModeSvg.style.display = 'block';
                localStorage.setItem('theme', theme);
                break;
            default:
                new BadThemeError(STRS.BAD_THEME.replace('%s', theme));
        }
    }
    ;
    function onThemeTogglerClicked() {
        //
        const ROOT = document.documentElement;
        const newTheme = ROOT.getAttribute("data-theme") === "light" ? "dark" : "light";
        try {
            switchTheme(newTheme);
        }
        catch (err) {
            console.error(err);
        }
    }
    // Applying the initial theme...
    const CURR_THEME = getPreferredTheme();
    switchTheme(CURR_THEME);
})();
//# sourceMappingURL=base.js.map