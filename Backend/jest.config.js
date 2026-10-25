module.exports = {
  testEnvironment: 'node',
  testTimeout: 60000,
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  clearMocks: true,
};
