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

export function GoogleAuthButton() {
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isInitializedRef = useRef(false);
  const buttonRef = useRef<HTMLDivElement | null>(null);

  // Initialize Google Sign-In once on mount
  useEffect(() => {
    if (!googleClientId) {
      console.warn('VITE_GOOGLE_CLIENT_ID is not configured');
      return;
    }

    if (isInitializedRef.current) return;
    
    const initializeGoogle = () => {
      if (!window.google?.accounts?.id) {
        console.error('Google library not available');
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCallback,
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
        console.log('Google Sign-In initialized');
      } catch (error) {
        console.error('Failed to initialize Google:', error);
      }
    };

    // Check if Google library is loaded
    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else {
      // Wait for Google library to load
      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          initializeGoogle();
          clearInterval(checkInterval);
        }
      }, 500);

      return () => clearInterval(checkInterval);
    }
  }, [googleClientId]);

  const handleGoogleCallback = async (response: any) => {
    setLoading(true);

    try {
      if (!response?.credential) {
        throw new Error('No credentials received from Google');
      }

      const googleToken = response.credential;

      // Decode the JWT token to get user info
      const parts = googleToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const { sub: googleId, name, email, picture } = JSON.parse(jsonPayload);

      if (!googleId || !email) {
        throw new Error('Missing required information from Google');
      }

      const success = await signInWithGoogle({ googleId, email, name, avatar: picture });

      if (success) {
        toast.success(`Welcome ${name || email}!`);
        // Navigate to home
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 500);
        return;
      } else {
        throw new Error(data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to authenticate with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {googleClientId ? (
        <>
          <div
            ref={buttonRef}
            className="flex min-h-[44px] w-full items-center justify-center [&>div]:mx-auto"
          />
          {loading && (
            <p className="mt-2 text-center text-xs text-muted-foreground">Signing in...</p>
          )}
        </>
      ) : (
        <Button
          type="button"
          disabled
          className="w-full py-3 px-4 border border-border rounded-none bg-white text-black disabled:opacity-50 disabled:cursor-not-allowed"
          title="Google login not configured"
        >
          Google login not configured
        </Button>
      )}
    </div>
  );
}
