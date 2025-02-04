//
//
//

import {showElemAccessErr} from '@utils/funcs';

(function() {
   class BadThemeError extends Error {
      constructor(message: string) {
      super(message);
      this.name = 'BadThemeError';
      }
   }


   const STRS = {
      BAD_THEME: 'Invalid theme %s',
   };


   document.addEventListener('DOMContentLoaded', onDomLoaded);


   function onDomLoaded(): void {
      // Adding click handler for `theme-toggler` button...
      let themeToggler = document.getElementById(
         'theme-toggler') as HTMLButtonElement | null;
      if (!themeToggler) {
         showElemAccessErr('start-stop');
         return;
      }
      themeToggler.addEventListener(
         'click',
         onThemeTogglerClicked,
      );
   }


   /**
    * Returns the preferred theme which is the first available value in the
    * following order:
    * 1. The previous user choice.
    * 2. The browser theme choice.
    * 3. The light theme.
    * @returns {string}
    */
   function getPreferredTheme(): string {
      const SAVED_THEME = localStorage.getItem('theme');
      if (SAVED_THEME) {
         return SAVED_THEME;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ?
         'dark' : 'light';
   };


   /**
    * Changes theme of the page. It throws `BadThemeError`, if `theme` value
    * is unknown.
    * @param theme 
    * @returns 
    */
   function switchTheme(theme: string): void {
      const ROOT = document.documentElement;
      let themeToggler = document.getElementById(
         'theme-toggler') as HTMLButtonElement | null;
      if (!themeToggler) {
         showElemAccessErr('start-stop');
         return;
      }
      switch (theme) {
         case 'light':
            ROOT.setAttribute('data-theme', theme);
            themeToggler.style.backgroundImage = "url('/assets/img/dark-mode.png')";
            localStorage.setItem('theme', theme);
            break;
         case 'dark':
            ROOT.setAttribute('data-theme', theme);
            themeToggler.style.backgroundImage = "url('/assets/img/light-mode.png')";
            localStorage.setItem('theme', theme);
            break;
         default:
            new BadThemeError(STRS.BAD_THEME.replace('%s', theme));
      }
   };


   function onThemeTogglerClicked(): void {
      //
      const ROOT = document.documentElement;
      const newTheme = ROOT.getAttribute("data-theme") === "light" ? "dark" : "light";
      try {
         switchTheme(newTheme);
      } catch (err: unknown) {
         console.error(err);
      }
   }


   // Applying the initial theme...
   const CURR_THEME = getPreferredTheme();
   switchTheme(CURR_THEME);
})();
