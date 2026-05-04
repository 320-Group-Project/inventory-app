const nextJest = require('next/jest');

const createJestConfig = nextJest({
    dir: './',
});

const customJestConfig = {
    testEnvironment: 'node',
    testMatch: ['**/?(*.)+(test).[jt]s?(x)'],
};

module.exports = createJestConfig(customJestConfig);
