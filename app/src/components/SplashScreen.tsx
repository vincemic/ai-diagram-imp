import React from 'react';
import '../styles/theme.css';

interface SplashScreenProps {
  logoSrc: string;
  loadingText?: string;
  onBypass?: () => void; // user initiated bypass
  fadingOut?: boolean; // retained for compatibility
  minDurationMs?: number; // allow override in tests
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ logoSrc, loadingText = 'Loading…', onBypass, fadingOut, minDurationMs = 4000 }) => {
  const handleUserBypass = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    onBypass?.();
  };
  return (
    <div
      className={`splash-screen ${fadingOut ? 'fade-out' : ''}`}
      role="dialog"
      aria-label="Loading"
      tabIndex={0}
      onClick={handleUserBypass}
      onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') handleUserBypass(e); }}
      data-min-duration={minDurationMs}
    >
      <img className="splash-logo" src={logoSrc} alt="App Logo" draggable={false} />
      <div className="splash-loading-text">{loadingText}</div>
      <div style={{ position: 'absolute', bottom: '12px', fontSize: '0.7rem', opacity: 0.4 }}>(Press Esc / Enter / Click to continue)</div>
    </div>
  );
};
