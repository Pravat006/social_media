module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/auth.test.ts', '**/chat.test.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/../http/src/$1',
        '^@repo/shared$': '<rootDir>/../../packages/shared/src/index.ts',
        '^@repo/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
        '^@repo/auth$': '<rootDir>/../../packages/auth/src/index.ts',
        '^@repo/env-config$': '<rootDir>/../../packages/env-config/src/index.ts',
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};
