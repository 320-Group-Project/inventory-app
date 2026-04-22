const nextJest = require('next/jest');

const createJestConfig = nextJest({
    dir: './',
});

const customJestConfig = {
    testEnvironment: 'node',
    testMatch: ['**/tests-unit/**/*.test.[jt]s?(x)'],
    testPathIgnorePatterns: ['/node_modules/', '/tests-e2e/'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
};

module.exports = createJestConfig(customJestConfig);
