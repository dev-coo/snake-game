import '@testing-library/jest-dom';
import 'jest-canvas-mock';

// Mock Phaser for tests
jest.mock('phaser', () => ({
  Scene: class MockScene {
    add = {
      graphics: jest.fn(() => ({
        clear: jest.fn(),
        fillStyle: jest.fn(),
        fillRect: jest.fn(),
        fillCircle: jest.fn(),
        fillTriangle: jest.fn(),
        lineStyle: jest.fn(),
        strokeCircle: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        closePath: jest.fn(),
        fillPath: jest.fn(),
        destroy: jest.fn(),
      })),
    };
  },
  Display: {
    Color: {
      HexStringToColor: jest.fn((hex) => ({ color: parseInt(hex.slice(1), 16) })),
    },
  },
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});