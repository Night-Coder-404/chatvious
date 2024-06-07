import "../css/styles.css";
import {
  themeSwitch,
  isOSDefaultDarkMode,
  preferedTheme,
} from "./navBar/navBar";
import updateTheme from "./navBar/updateTheme";

// adding theme Switch Event listener
themeSwitch.addEventListener("change", () => {
  updateTheme(isOSDefaultDarkMode, themeSwitch, preferedTheme);
});

console.log("testing");
