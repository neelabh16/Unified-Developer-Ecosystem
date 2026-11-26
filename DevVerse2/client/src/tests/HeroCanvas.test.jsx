import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import HeroCanvas from '../components/common/HeroCanvas';

function renderHeroCanvas(motion = 'on') {
  return render(
    <AuthContext.Provider value={{ user: null, isAuthenticated: false }}>
      <ThemeContext.Provider
        value={{
          theme: 'dark',
          accent: 'violet',
          motion,
          setTheme: () => {},
          toggleTheme: () => {},
          setAccent: () => {},
          setMotion: () => {},
        }}
      >
        <HeroCanvas height={260} />
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}

describe('HeroCanvas', () => {
  it('renders graceful non-WebGL fallback in jsdom without crashing', () => {
    renderHeroCanvas('on');
    expect(screen.getByTestId('hero-canvas-fallback')).toBeInTheDocument();
  });

  it('renders fallback when motion is set to off', () => {
    renderHeroCanvas('off');
    expect(screen.getByTestId('hero-canvas-fallback')).toBeInTheDocument();
  });
});
