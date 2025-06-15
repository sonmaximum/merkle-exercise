module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: [
        '**/test/**/*.test.ts',
    ],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/index.ts', // Exclude entry point
        '!src/**/*.d.ts', // Exclude type definitions
        '!src/**/index.ts', // Exclude index files
    ],
    coverageReporters: ['text', 'lcov'],
};
