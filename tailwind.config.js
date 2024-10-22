/**
 * @type {import("tailwindcss").Config}
 */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        polkadot: {
          0: "#FFFFFF",
          100: "#E1DDFF",
          200: "#D6BBFF",
          300: "#DF98FF",
          400: "#FC76FF",
          500: "#E6007A",
          600: "#5E39F2",
          700: "#472FA7",
          800: "#0F1750",
          900: "#01050C",
        },
      },
    },
  },
  plugins: [
    function ({ addVariant }) {
      addVariant("group-state-open", ':merge(.group)[data-state="open"] &')
    },
  ],
}
