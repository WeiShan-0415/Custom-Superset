module.exports = {
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  transformIgnorePatterns: [],

  moduleNameMapper: {
    '\\.(css|less|scss|sass|gif|ttf|eot|svg|png|jpg|jpeg|woff|woff2)$':
      '<rootDir>/test/__mocks__/mockExportString.js',
  },

  testEnvironment: 'jsdom',
};
