/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
      extend: {
        colors: {
          primary: {
            400: "#295CF6",
            600: "#FEBE15",
            900: "#031C30",
          },
          secondary: {
            500: "#E14F3F",
          },
          neutral: {
            100: "#FFFFFF",
            200: "#EAEAEA",
            300: "rgba(94, 100, 120, 0.86)",
            350: "#667A8A",
            400: "#5E6478",
            500: "#4B5563",
            900: "#1F2937",
          },
        },
      },
    },
    plugins: [],
  };