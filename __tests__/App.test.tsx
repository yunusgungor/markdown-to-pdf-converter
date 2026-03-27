import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText(/Sistem Hazır/)).toBeInTheDocument();
  });

  it('renders with light theme by default', () => {
    render(<App />);
    const container = document.querySelector('.min-h-screen');
    expect(container).toHaveClass('bg-white');
  });

  it('can toggle to dark theme', async () => {
    render(<App />);
    
    // Verify light mode is active
    expect(document.documentElement).not.toHaveClass('dark');
    
    // Find and click theme toggle button (Turkish: "Karanlık Moda Geç")
    const themeButton = screen.getByTitle('Karanlık Moda Geç');
    themeButton.click();
    
    // After click, dark mode should be active
    await waitFor(() => {
      expect(document.documentElement).toHaveClass('dark');
    });
  });

  it('renders with initial empty markdown', () => {
    render(<App />);
    // Footer shows line count - empty should show 0
    expect(screen.getByText(/Satır:/)).toBeInTheDocument();
  });
});
