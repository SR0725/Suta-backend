/** @type {import("prettier").Config} */
const prettierConfig = {
  plugins: ["@trivago/prettier-plugin-sort-imports"],
  importOrder: ["<THIRD_PARTY_MODULES>", "^@[^\\/]", "^@\\/", "^\\.\\/"],
  arrowParens: "always",
  trailingComma: "es5",
  singleQuote: false,
  semi: true,
  tabWidth: 2,
  printWidth: 80,
};

module.exports = prettierConfig;
