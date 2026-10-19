import '@testing-library/jest-dom/vitest';
import { webViewMock } from './mocks/react-native-webview';

beforeEach(() => {
  webViewMock.reset();
  vi.clearAllMocks();
});
