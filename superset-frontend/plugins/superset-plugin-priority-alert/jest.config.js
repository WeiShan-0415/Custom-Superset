module.exports = {
  moduleFileExtensions: ['mock.js', 'ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '\\.(gif|ttf|eot|png|jpg)$': '<rootDir>/test/__mocks__/mockExportString.js',
    '\\.(css|less|scss|sass)$': '<rootDir>/test/styleMock.cjs',
    '\\.(svg|png|jpg|jpeg|gif|webp|ico|ttf|woff|woff2|eot)$':
      '<rootDir>/test/fileMock.cjs',
  },
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },

  transformIgnorePatterns: [
    '/node_modules/(?!(decode-named-character-reference|character-entities|markdown-table|ccount|escape-string-regexp|bail|devlop|longest-streak|trim-lines|nanoid|d3-[^/]+|internmap|pretty-ms|parse-ms|react-error-boundary|rehype-[^/]+|remark-[^/]+|hast-util-[^/]+|unist-util-[^/]+|mdast-util-[^/]+|micromark[^/]*|unified|vfile[^/]*|property-information|space-separated-tokens|comma-separated-tokens|web-namespaces|zwitch)/)',
  ],
};
