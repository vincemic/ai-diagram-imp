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
const PREF_KEY = 'diagramimp.skipSplash';
const storedSkip = (() => {
	try { return localStorage.getItem(PREF_KEY) === '1'; } catch { return false; }
})();
// New logic: show splash on first visit in BOTH dev & prod unless:
// - User previously bypassed (storedSkip)
// - Explicitly forced off via VITE_FORCE_SPLASH=0/false
// Force on overrides everything; force off overrides everything else.
let enableSplash: boolean;
if (forceOn) enableSplash = true; else if (forceOff) enableSplash = false; else enableSplash = !storedSkip;

const container = document.getElementById('root');
if (!container) throw new Error('Root container not found');
const Root: React.FC = () => {
	if (!enableSplash) return <App />;
		const [showSplash, setShowSplash] = useState<boolean>(enableSplash);
		const [fade, setFade] = useState<boolean>(false);
	const splashStart = React.useRef<number | null>(null);

	useEffect(() => {
		if (!enableSplash) return;
		splashStart.current = performance.now();
		// Trigger fade-out after 4s; hide shortly after fade transition ends (300ms as defined in CSS)
		const minDuration = 4000; // ms
		const fadeTimer = setTimeout(() => setFade(true), minDuration);
		const hideTimer = setTimeout(() => setShowSplash(false), minDuration + 320);
		return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
	}, [enableSplash]);

	const bypass = () => {
		if (!showSplash) return;
		const now = performance.now();
		const start = splashStart.current ?? now;
		const elapsed = now - start;
		const remaining = 4000 - elapsed;
		if (remaining > 0) {
			// Wait remaining then fade/hide quickly
			setTimeout(() => {
				setFade(true);
				setTimeout(() => setShowSplash(false), 320);
			}, remaining);
		} else {
			setFade(true);
			setTimeout(() => setShowSplash(false), 320);
		}
		try { localStorage.setItem(PREF_KEY, '1'); } catch { /* ignore */ }
	};

	return showSplash ? <SplashScreen logoSrc={logoUrl} fadingOut={fade} onBypass={bypass} /> : <App />;
};

createRoot(container).render(<Root />);
