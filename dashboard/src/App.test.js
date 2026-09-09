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

test('shows back to dashboard from a module section', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /enter dashboard/i }));
  fireEvent.click(screen.getByRole('button', { name: /shortfall risk/i }));
  expect(screen.getByRole('button', { name: /back to dashboard/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /back to dashboard/i }));
  expect(screen.getByText(/national mining intelligence/i)).toBeInTheDocument();
});
