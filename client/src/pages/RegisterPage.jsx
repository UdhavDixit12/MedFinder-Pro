import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import AuthShell from '../components/AuthShell.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import { Input } from '../components/ui/FormField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { safeRedirect, validateEmail, validateName, validatePassword } from '../utils/validation.js';

export default function RegisterPage() {
  useDocumentTitle('Create account');
  const { register, isAuthenticated } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const redirect = safeRedirect(sp.get('redirect'));

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
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
    const next = {
      name: validateName(form.name),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirm: form.confirm !== form.password ? 'Passwords do not match.' : null,
    };
    setErrors(next);
    setFormError(null);
    if (Object.values(next).some(Boolean)) return;

    setSubmitting(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      notify('Your account has been created.', 'success');
      navigate(redirect, { replace: true });
    } catch (err) {
      setFormError(err.message);
      if (err.fields) setErrors(err.fields);
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Save facilities and access them from any device."
      footer={
        <>
          Already have an account?{' '}
          <Link to={`/login${sp.get('redirect') ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-semibold text-brand-700 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}
        <Input label="Full name" name="name" autoComplete="name" value={form.name} onChange={onChange} error={errors.name} required maxLength={80} />
        <Input label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} error={errors.email} required />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={onChange}
          error={errors.password}
          hint="At least 8 characters, including a letter and a number."
          required
          maxLength={128}
        />
        <Input
          label="Confirm password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={onChange}
          error={errors.confirm}
          required
          maxLength={128}
        />
        <Button type="submit" className="w-full" size="lg" icon={UserPlus} loading={submitting}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
