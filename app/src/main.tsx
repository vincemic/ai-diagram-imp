import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/App.js';
import { SplashScreen } from './components/SplashScreen.js';
import './styles/theme.css';

// Import logo from repo root using Vite ?url so it copies the asset. Adjust path with base during build.
// The filename includes a space; encode it. Relative path from /app/src to repo root is '../..'
// We copy at build; if this fails consider moving asset into /app/public.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import logoUrl from '../../diagramimp .png?url';

// Determine whether to enable splash:
// - Default: enabled only in production build (import.meta.env.PROD)
// - Override: VITE_FORCE_SPLASH=1 forces on, =0 forces off.
const forceFlag = import.meta.env.VITE_FORCE_SPLASH;
const forceOn = forceFlag === '1' || forceFlag === 'true';
const forceOff = forceFlag === '0' || forceFlag === 'false';
const enableSplash = forceOn ? true : forceOff ? false : import.meta.env.PROD;

const container = document.getElementById('root');
if (!container) throw new Error('Root container not found');
const Root: React.FC = () => {
	if (!enableSplash) return <App />;
	const [showSplash, setShowSplash] = useState(true);
	const [fade, setFade] = useState(false);

	useEffect(() => {
		const fadeTimer = setTimeout(() => setFade(true), 600);
		const hideTimer = setTimeout(() => setShowSplash(false), 900);
		return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
	}, []);

	return showSplash ? <SplashScreen logoSrc={logoUrl} fadingOut={fade} /> : <App />;
};

createRoot(container).render(<Root />);
