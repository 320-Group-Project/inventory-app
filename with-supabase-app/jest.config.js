const nextJest = require('next/jest');

const createJestConfig = nextJest({
    dir: './',
});

const customJestConfig = {
    testEnvironment: 'node',
    testPathIgnorePatterns: [
        "./node_modules/",
        "./tests-e2e/"
    ],
};

module.exports = createJestConfig(customJestConfig);
