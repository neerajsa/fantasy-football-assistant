import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders draft configuration', () => {
  render(<App />);
  const configElement = screen.getByText(/Draft Configuration/i);
  expect(configElement).toBeInTheDocument();
});
