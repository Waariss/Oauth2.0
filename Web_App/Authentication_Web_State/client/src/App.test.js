import { render, screen } from '@testing-library/react';
import App from './App';

test('renders oauth security portal heading', () => {
  render(<App />);
  const heading = screen.getByText(/OAuth 2.0 Security Test Portal/i);
  expect(heading).toBeInTheDocument();
});
