/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "#F7F8FA",
          surface: "#FFFFFF",
          text: "#17202A",
          secondary: "#667085",
          muted: "#98A2B3",
          border: "#E4E7EC",
          brand: "#245B8F",
          brandHover: "#1D4D79",
          subtle: "#F0F6FB",
          success: "#2F7D5A",
          warning: "#B7791F",
          highRisk: "#C65D32",
          critical: "#C43D3D",
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
