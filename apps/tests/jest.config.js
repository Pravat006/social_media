module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/../ws/src/$1',
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};
