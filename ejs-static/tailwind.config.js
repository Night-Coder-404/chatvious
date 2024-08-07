/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui";

export default {
  content: [
    "../serverless-aws-sam/src/views/**/*.ejs",
    "./public/client-ejs/**/*.ejs",
  ],
  safelist: [
    {
      pattern: /bg-(blue|green|orange|yellow|sky|purple|pink)-500/,
    },
    "bg-error",
    "text-error-content",
    "bg-success",
    "text-success-content",
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: false, // false: only light + dark | true: all themes | array: specific themes like this ["light", "dark", "cupcake"]
    darkTheme: "dark", // name of one of the included themes for dark mode
    base: true, // applies background color and foreground color for root element by default
    styled: true, // include daisyUI colors and design decisions for all components
    utils: true, // adds responsive and modifier utility classes
    prefix: "", // prefix for daisyUI classnames (components, modifiers and responsive class names. Not colors)
    logs: true, // Shows info about daisyUI version and used config in the console when building your CSS
    themeRoot: ":root", // The element that receives theme color CSS variables
  },
};
