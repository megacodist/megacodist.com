//
//
//

import {showElemAccessErr} from '@utils/funcs';

document.addEventListener('DOMContentLoaded', base_onDomLoaded);


function base_onDomLoaded(): void {
   // Adding click handler for `theme-toggler` button...
   let themeToggler = document.getElementById(
      'theme-toggler') as HTMLButtonElement | null;
   if (!themeToggler) {
      showElemAccessErr('start-stop');
      return;
   }
   themeToggler.addEventListener(
      'click',
      base_onThemeTogglerClicked,
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
function base_getPreferredTheme(): string {
   const SAVED_THEME = localStorage.getItem('theme');
   if (SAVED_THEME) {
      return SAVED_THEME;
   }
   return window.matchMedia('(prefers-color-scheme: dark)').matches ?
      'dark' : 'light';
};


function base_switchTheme(theme: string): void {
   const ROOT = document.documentElement;
   ROOT.setAttribute('data-theme', theme);
   localStorage.setItem('theme', theme);
 };


 function base_onThemeTogglerClicked(): void {
   //
 }


 // Applying the initial theme...
const CURR_THEME = base_getPreferredTheme();
base_switchTheme(CURR_THEME);
