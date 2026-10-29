import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Heart, KeyRound, LogOut, MapPin, Navigation, Phone, RefreshCw, Search, Trash2, UserRound } from 'lucide-react';
import CategoryIcon, { CategoryBadge } from '../components/CategoryIcon.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import Modal from '../components/ui/Modal.jsx';
import { Input } from '../components/ui/FormField.jsx';
import { Card, Container, EmptyState } from '../components/ui/Misc.jsx';
import { SkeletonList } from '../components/ui/Skeleton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFavourites } from '../context/FavouritesContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { userService } from '../services/index.js';
import { googleDirectionsUrl, telHref } from '../utils/facility.js';
import { validateName, validatePassword } from '../utils/validation.js';

function ProfileCard() {
  const { user, updateProfile } = useAuth();
  const { notify } = useToast();
  const [form, setForm] = useState({ name: user.name, homeLocation: user.homeLocation || '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const dirty = form.name !== user.name || form.homeLocation !== (user.homeLocation || '');

  const onSubmit = async (e) => {
    e.preventDefault();
    const nameError = validateName(form.name);
    const locError = form.homeLocation.length > 120 ? 'Home location must be 120 characters or fewer.' : null;
    setErrors({ name: nameError, homeLocation: locError });
    if (nameError || locError) return;
    setSaving(true);
    try {
      await updateProfile({ name: form.name.trim(), homeLocation: form.homeLocation.trim() });
      notify('Profile updated.', 'success');
    } catch (err) {
      setErrors(err.fields || {});
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-brand-700">
          <UserRound className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold text-slate-900">Profile</h2>
          <p className="truncate text-sm text-slate-600">{user.email}</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
        <Input label="Full name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={errors.name} maxLength={80} required />
        <Input
          label="Home location"
          hint="Used as a quick-search shortcut. Optional."
          placeholder="e.g. Bhiwani, Haryana"
          value={form.homeLocation}
          onChange={(e) => setForm((f) => ({ ...f, homeLocation: e.target.value }))}
          error={errors.homeLocation}
          maxLength={120}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={saving} disabled={!dirty}>
            Save changes
          </Button>
          {user.homeLocation && (
            <Button to={`/hospitals?location=${encodeURIComponent(user.homeLocation)}`} variant="outline" icon={Search}>
              Search near home
            </Button>
          )}
        </div>
      </form>
      <p className="mt-4 text-xs text-slate-500">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
    </Card>
  );
}

function PasswordCard() {
  const { notify } = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: null }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {
      currentPassword: form.currentPassword ? null : 'Current password is required.',
      newPassword: validatePassword(form.newPassword),
      confirm: form.confirm !== form.newPassword ? 'Passwords do not match.' : null,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setSaving(true);
    try {
      await userService.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      notify('Password changed.', 'success');
    } catch (err) {
      setErrors(err.fields || {});
      if (!err.fields) notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
        <KeyRound className="h-4 w-4 text-slate-500" aria-hidden="true" /> Change password
      </h2>
      <form onSubmit={onSubmit} className="mt-4 space-y-4" noValidate>
        <Input label="Current password" type="password" autoComplete="current-password" value={form.currentPassword} onChange={set('currentPassword')} error={errors.currentPassword} required />
        <Input label="New password" type="password" autoComplete="new-password" value={form.newPassword} onChange={set('newPassword')} error={errors.newPassword} hint="At least 8 characters, including a letter and a number." required />
        <Input label="Confirm new password" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} required />
        <Button type="submit" variant="outline" loading={saving}>
          Update password
        </Button>
      </form>
    </Card>
  );
}

function SavedFacility({ fav, onRemove, removing }) {
  const s = fav.snapshot;
  const name = s.name || `Unnamed ${(s.categoryLabel || 'facility').toLowerCase()}`;
  const phoneHref = telHref(s.phones?.[0]);
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex gap-3">
        <CategoryIcon category={s.category} />
        <div className="min-w-0 flex-1">
          <Link to={`/hospitals/${fav.osmType}/${fav.osmId}`} className="font-semibold text-slate-900 hover:text-brand-700">
            {name}
          </Link>
          <div className="mt-1">
            <CategoryBadge category={s.category} label={s.categoryLabel} />
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-600">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            {s.address || <span className="text-slate-400">Address not listed</span>}
          </p>
          <p className="mt-1 text-xs text-slate-500">Saved {new Date(fav.createdAt).toLocaleDateString()} · details may have changed since</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        <Button href={googleDirectionsUrl(s)} target="_blank" rel="noopener noreferrer" size="sm" variant="subtle" icon={Navigation}>
          Directions
        </Button>
        {phoneHref && (
          <Button href={phoneHref} size="sm" variant="outline" icon={Phone}>
            Call
          </Button>
        )}
        <Button to={`/hospitals/${fav.osmType}/${fav.osmId}`} size="sm" variant="outline" icon={ExternalLink}>
          Latest details
        </Button>
        <Button size="sm" variant="danger" icon={Trash2} loading={removing} onClick={() => onRemove(fav)} className="ml-auto">
          Remove
        </Button>
      </div>
    </li>
  );
}

export default function DashboardPage() {
  useDocumentTitle('Dashboard');
  const { user, logout } = useAuth();
  const { favourites, status, error, reload, remove, isPending } = useFavourites();
  const { notify } = useToast();
  const [confirm, setConfirm] = useState(null);

  const doRemove = async () => {
    const fav = confirm;
    setConfirm(null);
    try {
      await remove(fav.osmType, fav.osmId);
      notify('Removed from saved facilities.', 'info');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <Container className="py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Hello, {user.name.split(' ')[0]}</h1>
          <p className="mt-1 text-sm text-slate-600">Manage your saved facilities and profile.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button to="/hospitals" icon={Search}>
            Search facilities
          </Button>
          <Button variant="outline" icon={LogOut} onClick={logout}>
            Log out
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section aria-labelledby="saved-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="saved-heading" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Heart className="h-5 w-5 text-brand-600" aria-hidden="true" /> Saved facilities
              {status === 'ready' && <span className="text-sm font-normal text-slate-500">({favourites.length})</span>}
            </h2>
          </div>

          {status === 'loading' && <SkeletonList count={3} />}
          {status === 'error' && (
            <Alert
              tone="error"
              title="Couldn't load your saved facilities"
              action={
                <Button size="sm" variant="outline" icon={RefreshCw} onClick={reload}>
                  Try again
                </Button>
              }
            >
              {error?.message}
            </Alert>
          )}
          {status === 'ready' && favourites.length === 0 && (
            <EmptyState
              icon={Heart}
              title="No saved facilities yet"
              action={
                <Button to="/hospitals" icon={Search}>
                  Find facilities
                </Button>
              }
            >
              Tap “Save” on any hospital, clinic or pharmacy in your search results to keep it here for quick access.
            </EmptyState>
          )}
          {status === 'ready' && favourites.length > 0 && (
            <ul className="grid gap-3 xl:grid-cols-2">
              {favourites.map((fav) => (
                <SavedFacility key={fav.id} fav={fav} onRemove={setConfirm} removing={isPending(fav.id)} />
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-6">
          <ProfileCard />
          <PasswordCard />
        </aside>
      </div>

      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title="Remove saved facility?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button variant="emergency" icon={Trash2} onClick={doRemove}>
              Remove
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          “{confirm?.snapshot?.name || 'This facility'}” will be removed from your dashboard. You can save it again at any time.
        </p>
      </Modal>
    </Container>
  );
}
