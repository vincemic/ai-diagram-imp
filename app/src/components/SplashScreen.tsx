import React from 'react';
import '../styles/theme.css';

interface SplashScreenProps {
  logoSrc: string;
  loadingText?: string;
  fadingOut?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ logoSrc, loadingText = 'Loading…', fadingOut }) => {
  return (
    <div className={`splash-screen ${fadingOut ? 'fade-out' : ''}`}> 
      <img className="splash-logo" src={logoSrc} alt="App Logo" draggable={false} />
      <div className="splash-loading-text">{loadingText}</div>
    </div>
  );
};
