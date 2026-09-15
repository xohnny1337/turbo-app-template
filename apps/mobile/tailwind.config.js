const { mobileColors } = require("@repo/theme/mobile");

/** @type {import('twrnc').Config} */
module.exports = {
  theme: {
    extend: {
      colors: mobileColors,
    },
  },
};
