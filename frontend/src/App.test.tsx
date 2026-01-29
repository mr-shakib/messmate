import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('should render the app title', () => {
    render(<App />);
    expect(screen.getByText('MessMate')).toBeInTheDocument();
  });

  it('should render the subtitle', () => {
    render(<App />);
    expect(screen.getByText('Manage your shared expenses with ease')).toBeInTheDocument();
  });

  it('should render the login form', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Log In' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });
});
