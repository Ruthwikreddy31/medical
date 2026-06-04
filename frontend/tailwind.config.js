export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "sans-serif"]
      },
      colors: {
        clinic: {
          ink: "#172029",
          muted: "#5b6875",
          panel: "#f7faf8",
          line: "#d8e4dd",
          green: "#0f7b63",
          amber: "#b7791f",
          red: "#b42318",
          blue: "#2563eb"
        }
      }
    }
  },
  plugins: []
};
