module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/utils/'
  ],
  setupFilesAfterEnv: ['./tests/setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/tests/$1'
  },
  testTimeout: 30000,
  clearMocks: true,
  restoreMocks: true,
  verbose: true,
  // Mock environment variables
  setupFiles: ['<rootDir>/tests/env.setup.js']
};
