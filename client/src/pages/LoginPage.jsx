import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import AuthShell from '../components/AuthShell.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import { Input } from '../components/ui/FormField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { safeRedirect, validateEmail } from '../utils/validation.js';

export default function LoginPage() {
  useDocumentTitle('Log in');
  const { login, isAuthenticated } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const redirect = safeRedirect(sp.get('redirect'));

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated && !submitting) return <Navigate to={redirect} replace />;

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: null }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = { email: validateEmail(form.email), password: form.password ? null : 'Password is required.' };
    setErrors(next);
    setFormError(null);
    if (next.email || next.password) return;

    setSubmitting(true);
    try {
      const user = await login({ email: form.email.trim(), password: form.password });
      notify(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
      navigate(redirect, { replace: true });
    } catch (err) {
      setFormError(err.message);
      if (err.fields) setErrors(err.fields);
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Log in to MedFinder Pro"
      subtitle="Access your saved facilities and profile."
      footer={
        <>
          New here?{' '}
          <Link to={`/register${sp.get('redirect') ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-semibold text-brand-700 hover:underline">
            Create a free account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}
        <Input label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} error={errors.email} required />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={onChange}
          error={errors.password}
          required
        />
        <Button type="submit" className="w-full" size="lg" icon={LogIn} loading={submitting}>
          Log in
        </Button>
      </form>
    </AuthShell>
  );
}
