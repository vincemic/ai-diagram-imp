import React from 'react';

interface HamburgerMenuProps {
  children: React.ReactNode;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ children }) => {
  const [open, setOpen] = React.useState(false);
  const toggle = () => setOpen(o => !o);
  const close = () => setOpen(false);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const menu = document.querySelector('.hamburger-menu');
      if (menu && !menu.contains(e.target as Node)) {
        close();
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className={"hamburger-root" + (open ? ' is-open' : '')}>
      <button
        type="button"
        aria-label="Main menu"
        aria-haspopup="true"
        aria-expanded={open ? 'true' : 'false'}
        className="hamburger-button"
        onClick={toggle}
      >
        <span className="hamburger-icon" aria-hidden="true">
          <span /><span /><span />
        </span>
      </button>
      {open && (
        <div className="hamburger-menu" role="group">
          {children}
        </div>
      )}
    </div>
  );
};
