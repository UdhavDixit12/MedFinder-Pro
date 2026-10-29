import { ShieldCheck } from 'lucide-react';
import { Card, Container } from './ui/Misc.jsx';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <Container className="flex justify-center py-12 sm:py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
        </div>
        <Card className="p-6 sm:p-8">{children}</Card>
        {footer && <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>}
        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Passwords are securely hashed. Sessions use an HTTP-only cookie.
        </p>
      </div>
    </Container>
  );
}
