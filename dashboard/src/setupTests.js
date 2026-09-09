// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// jsPDF's PNG dependencies expect Web APIs that Jest's jsdom does not provide.
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mermaid needs browser APIs; stub it for unit tests.
jest.mock('mermaid', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    render: jest.fn(async (id) => ({
      svg: `<svg id="${id}" xmlns="http://www.w3.org/2000/svg" width="800" height="200"><text x="12" y="24">Architecture diagram</text></svg>`,
    })),
  },
}));

