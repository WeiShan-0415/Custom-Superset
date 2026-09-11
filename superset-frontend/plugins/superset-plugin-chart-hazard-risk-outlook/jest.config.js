module.exports = {
   transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  moduleFileExtensions: ['mock.js', 'ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '\\.(gif|ttf|eot|png|jpg)$': '<rootDir>/test/__mocks__/mockExportString.js',
    '\\.(css|less|scss|sass)$': '<rootDir>/test/styleMock.cjs',
    '\\.(svg|png|jpg|jpeg|gif|webp|ico|ttf|woff|woff2|eot)$':
      '<rootDir>/test/fileMock.cjs',
  },
  testEnvironment: 'jsdom',
  transformIgnorePatterns: [
   '/node_modules/(?!(nanoid|d3-[^/]+|internmap|pretty-ms|parse-ms|react-error-boundary)/)',
],
};
