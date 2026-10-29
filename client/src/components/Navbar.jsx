import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, Phone, X } from 'lucide-react';
import Brand from './Brand.jsx';
import Button from './ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { cn } from '../utils/cn.js';

const LINKS = [
  { to: '/hospitals', label: 'Find care' },
  { to: '/symptoms', label: 'Symptom checker' },
  { to: '/emergency', label: 'Emergency' },
  { to: '/about', label: 'About' },
];

const linkClass = ({ isActive }) =>
  cn(
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  );

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user, logout, status } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  const handleLogout = async () => {
    await logout();
    notify('You have been logged out.', 'success');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-[1000] border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8" aria-label="Main">
        <Brand />

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button href="tel:112" variant="danger" size="sm" icon={Phone} aria-label="Call 112 national emergency number">
            112
          </Button>
          {status === 'loading' ? (
            <div className="h-8 w-24" aria-hidden="true" />
          ) : isAuthenticated ? (
            <>
              <Button to="/dashboard" variant="ghost" size="sm" icon={LayoutDashboard}>
                <span className="max-w-32 truncate">{user?.name?.split(' ')[0] || 'Dashboard'}</span>
              </Button>
              <Button variant="outline" size="sm" icon={LogOut} onClick={handleLogout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button to="/login" variant="ghost" size="sm">
                Log in
              </Button>
              <Button to="/register" size="sm">
                Sign up
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-slate-200 bg-white md:hidden">
          <div className="space-y-1 px-4 py-3">
            {LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={(s) => cn(linkClass(s), 'block')}>
                {link.label}
              </NavLink>
            ))}
          </div>
          <div className="grid gap-2 border-t border-slate-100 px-4 py-3">
            {isAuthenticated ? (
              <>
                <Button to="/dashboard" variant="outline" icon={LayoutDashboard}>
                  Dashboard
                </Button>
                <Button variant="ghost" icon={LogOut} onClick={handleLogout}>
                  Log out
                </Button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button to="/login" variant="outline">
                  Log in
                </Button>
                <Button to="/register">Sign up</Button>
              </div>
            )}
            <Button href="tel:112" variant="emergency" icon={Phone}>
              Call 112 (Emergency)
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
