module.exports = {
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  transformIgnorePatterns: [
    'node_modules/(?!d3(-[a-z-]+)?|delaunator|robust-predicates|internmap|nanoid|pretty-ms|parse-ms|react-error-boundary|rehype-sanitize|hast-util-sanitize|unified|unist-.*|hast-.*|rehype-.*|remark-.*|mdast-.*|micromark-.*|markdown-table|decode-named-character-reference|character-entities|ccount|escape-string-regexp|parse-entities|property-information|space-separated-tokens|comma-separated-tokens|bail|devlop|zwitch|longest-streak)',
  ],

  moduleNameMapper: {
    '\\.(css|less|scss|sass|gif|ttf|eot|svg|png|jpg|jpeg|woff|woff2|geojson)$':
      '<rootDir>/test/__mocks__/mockExportString.js',
  },

  testEnvironment: 'jsdom',
};
