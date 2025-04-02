export default {
  testEnvironment: "jsdom",
  setupFiles: ["<rootDir>/jest.polyfill.js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "\\.(css|less)$": "identity-obj-proxy",
    "\\.(mp3|jpg|jpeg|png|svg)$": "<rootDir>/__mocks__/fileMock.js",
  },
  transform: {
    "^.+\\.[tj]sx?$": "babel-jest",
  },
};
