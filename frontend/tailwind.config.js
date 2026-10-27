/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#192A3A",
        ocean: "#246B72",
        coral: "#F28B65",
        sand: "#FFF8F0",
        mist: "#EAF3F2",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(25, 42, 58, 0.08)",
      },
    },
  },
  plugins: [],
};
