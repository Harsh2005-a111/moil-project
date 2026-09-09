import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('renders MineSight AI landing page first', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /minesight/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /enter dashboard/i })).toBeInTheDocument();
});

test('enters dashboard from landing page', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /enter dashboard/i }));
  expect(screen.getByText(/strictly for India and its constituent mine locations/i)).toBeInTheDocument();
});
