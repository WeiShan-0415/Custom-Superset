module.exports = {
  moduleFileExtensions: ['mock.js', 'ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '\\.(gif|ttf|eot|png|jpg)$': '<rootDir>/test/__mocks__/mockExportString.js',
     '^nanoid$': '<rootDir>/test/__mocks__/nanoid.js',
     '\\.(css|less|scss|sass)$': '<rootDir>/test/__mocks__/styleMock.js',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg|webp)$':
    '<rootDir>/test/__mocks__/fileMock.js',
  },
  testEnvironment: 'jsdom',
   transformIgnorePatterns: [
  '/node_modules/(?!(nanoid|d3-[^/]+|internmap|delaunator|robust-predicates|pretty-ms|parse-ms|react-error-boundary)/)',
   ],
};
