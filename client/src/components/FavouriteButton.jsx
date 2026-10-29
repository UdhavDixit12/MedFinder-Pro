import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Heart, LogIn } from 'lucide-react';
import Button from './ui/Button.jsx';
import Modal from './ui/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFavourites } from '../context/FavouritesContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { displayName } from '../utils/facility.js';
import { cn } from '../utils/cn.js';

export default function FavouriteButton({ facility, size = 'sm', showLabel = true, className }) {
  const { isAuthenticated } = useAuth();
  const { isFavourite, isPending, add, remove } = useFavourites();
  const { notify } = useToast();
  const location = useLocation();
  const [loginPrompt, setLoginPrompt] = useState(false);

  const saved = isFavourite(facility.id);
  const pending = isPending(facility.id);
  const name = displayName(facility);

  const toggle = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setLoginPrompt(true);
      return;
    }
    try {
      if (saved) {
        await remove(facility.osmType, facility.osmId);
        notify(`Removed “${name}” from your saved facilities.`, 'info');
      } else {
        await add(facility);
        notify(`Saved “${name}” to your dashboard.`, 'success');
      }
    } catch (err) {
      notify(err.message || 'Could not update saved facilities.', 'error');
    }
  };

  const redirect = encodeURIComponent(location.pathname + location.search);

  return (
    <>
      <Button
        variant={saved ? 'subtle' : 'outline'}
        size={showLabel ? size : size === 'sm' ? 'icon-sm' : 'icon'}
        onClick={toggle}
        loading={pending}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${name} from saved facilities` : `Save ${name}`}
        className={className}
      >
        {!pending && <Heart className={cn('h-4 w-4', saved && 'fill-current')} aria-hidden="true" />}
        {showLabel && (saved ? 'Saved' : 'Save')}
      </Button>
      <Modal
        open={loginPrompt}
        onClose={() => setLoginPrompt(false)}
        title="Log in to save facilities"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setLoginPrompt(false)}>
              Not now
            </Button>
            <Button to={`/register?redirect=${redirect}`} variant="outline">
              Create account
            </Button>
            <Button to={`/login?redirect=${redirect}`} icon={LogIn}>
              Log in
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-600">
          Saving facilities requires a free MedFinder Pro account so your list can be stored securely and shown on your
          dashboard. You can keep searching without an account.
        </p>
      </Modal>
    </>
  );
}
