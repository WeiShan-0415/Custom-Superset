module.exports = {
  moduleFileExtensions: ['mock.js', 'ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  transformIgnorePatterns: [],

  moduleNameMapper: {
    '\\.(gif|ttf|eot|png|jpg|geojson)$':
      '<rootDir>/test/__mocks__/mockExportString.js',
  },
  testEnvironment: 'jsdom',
};
