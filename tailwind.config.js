/**
 * @type {import("tailwindcss").Config}
 */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        polkadot: {
          950: "#030110",
          900: "#0C052C",
          800: "#23126D",
          700: "#4027AE",
          650: "#6543EF",
          600: "#5E39F2",
          500: "#E6007A",
          400: "#FC76FF",
          300: "#DB9EFF",
          200: "#E4DAFF",
          100: "#F2F3FF",
          0: "#FBFCFF",
        },
      },
    },
  },
  plugins: [
    function ({ addVariant }) {
      addVariant("group-state-open", ':merge(.group)[data-state="open"] &');
    },
  ],
};
