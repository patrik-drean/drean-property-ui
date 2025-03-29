// Import both API implementations
import * as realApi from './api';
import * as mockApi from './mock/mockApi';

// Use environment variable to determine which API to use
const useMockApi = process.env.REACT_APP_USE_MOCK_API === 'true';

// Export the appropriate API implementation
export const api = useMockApi ? mockApi : realApi; 