/** @type {import("eslint").Linter.Config} */
const config = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true
  },
  plugins: [
    "@typescript-eslint"
  ],
  extends: [
    "next",
    "next/core-web-vitals"
  ],
};
module.exports = config;