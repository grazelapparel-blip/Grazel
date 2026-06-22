import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

declare global {
  interface Window {
    google: any;
  }
}

const GoogleIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// Check if the Google Client ID is properly configured (not a placeholder)
const isValidClientId = (clientId: string | undefined): boolean => {
  if (!clientId) return false;
  if (clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') return false;
  if (clientId.includes('YOUR_')) return false;
  if (clientId.trim() === '') return false;
  return true;
};

// ─── Dev-mode Google Login ────────────────────────────────────────────────────
// When VITE_GOOGLE_CLIENT_ID is not set, this simulates the Google OAuth flow
// using the same /api/auth/google backend endpoint so auth works end-to-end.
function DevGoogleLogin() {
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // Generate a stable mock Google ID from the email so the same account
      // maps to the same user row on every sign-in.
      const mockGoogleId = `dev_google_${btoa(email.toLowerCase()).replace(/[^a-z0-9]/gi, '')}`;
      const success = await signInWithGoogle({
        googleId: mockGoogleId,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=random&size=128`,
      });

      if (success) {
        toast.success(`Welcome, ${name}!`);
        setOpen(false);
        setTimeout(() => navigate('/', { replace: true }), 300);
      }
    } catch (err: any) {
      toast.error(err.message || 'Sign-in failed — please try again');
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <div className="w-full space-y-1.5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-border bg-white hover:bg-gray-50 text-sm text-gray-700 font-medium transition-colors"
        >
          <GoogleIcon />
          Continue with Google
        </button>
        <p className="text-center text-[10px] text-muted-foreground/50">
          Dev mode — no Google Client ID configured
        </p>
      </div>
    );
  }

  return (
    <div className="w-full border border-border bg-white p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <GoogleIcon />
        <span className="text-sm font-medium text-gray-700">Continue with Google</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            autoFocus
            className="w-full px-3 py-2 border border-border text-sm bg-background focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Email address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3 py-2 border border-border text-sm bg-background focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-none text-xs py-2"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-none text-xs py-2"
            onClick={() => { setOpen(false); setName(''); setEmail(''); }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function GoogleAuthButton() {
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isConfigured = isValidClientId(googleClientId);
  const isInitializedRef = useRef(false);
  const buttonRef = useRef<HTMLDivElement | null>(null);

  // Use dev mode when no real Client ID is configured
  if (!isConfigured) {
    return <DevGoogleLogin />;
  }

  // Initialize real Google Sign-In once on mount
  useEffect(() => {
    if (isInitializedRef.current) return;

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id) {
        setInitError('Google Sign-In library failed to load. Check your internet connection.');
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCallback,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (buttonRef.current) {
          buttonRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            shape: 'rectangular',
            text: 'continue_with',
            width: buttonRef.current.offsetWidth || 360,
          });
        }

        isInitializedRef.current = true;
        setInitError(null);
      } catch (error: any) {
        console.error('Failed to initialize Google Sign-In:', error);
        setInitError('Failed to initialize Google Sign-In. Please refresh and try again.');
      }
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else {
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.id) {
          initializeGoogle();
          clearInterval(checkInterval);
        } else if (attempts >= 20) {
          clearInterval(checkInterval);
          setInitError('Google Sign-In failed to load. Please refresh the page.');
        }
      }, 500);
      return () => clearInterval(checkInterval);
    }
  }, [googleClientId]);

  const handleGoogleCallback = async (response: any) => {
    setLoading(true);
    try {
      if (!response?.credential) throw new Error('No credentials received from Google');

      const parts = response.credential.split('.');
      if (parts.length !== 3) throw new Error('Invalid Google token format');

      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
      const { sub: googleId, name, email, picture } = JSON.parse(jsonPayload);

      if (!googleId || !email) throw new Error('Required user information missing from Google response');

      const success = await signInWithGoogle({ googleId, email, name, avatar: picture });
      if (success) {
        toast.success(`Welcome, ${name || email}!`);
        setTimeout(() => navigate('/', { replace: true }), 300);
      } else {
        throw new Error('Authentication failed — please try again');
      }
    } catch (error: any) {
      console.error('Google auth callback error:', error);
      toast.error(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  if (initError) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full py-3 rounded-none text-xs text-destructive border-destructive/30"
        onClick={() => window.location.reload()}
      >
        {initError} — Click to retry
      </Button>
    );
  }

  return (
    <div className="w-full">
      <div ref={buttonRef} className="flex min-h-[44px] w-full items-center justify-center [&>div]:mx-auto" />
      {loading && (
        <p className="mt-2 text-center text-xs text-muted-foreground animate-pulse">Signing in with Google…</p>
      )}
    </div>
  );
}
