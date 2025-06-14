/* eslint-env jest */
// Early Jest setup - runs before jest.mock() hoisting
// Suppress WatermelonDB logs for all tests
const logger = require('@nozbe/watermelondb/utils/common/logger').default;
logger.silence();