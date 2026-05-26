import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Lock, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { toast } from 'sonner';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const success = await signIn(email, password);
        if (success) {
          toast.success('Successfully logged in!');
          navigate('/', { replace: true });
        }
      } else {
        const success = await signUp(name, email, password, 'user');
        if (success) {
          toast.success('Registration successful. Please sign in to continue.');
          setIsLogin(true);
          setName('');
          setPassword('');
          navigate('/auth', { replace: true, state: location.state });
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during authentication');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-60px)] bg-background-cream flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Animated background highlights */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] aspect-square rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] aspect-square rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

        <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
          <button
            onClick={() => navigate(-1)}
            className="group mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back
          </button>
          
          <h2 className="font-serif text-4xl text-center text-foreground tracking-tight">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {isLogin ? "Welcome back to Grazel's digital atelier" : 'Join us for a tailored shopping experience'}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
          <div className="bg-card border border-border px-8 py-10 shadow-mega sm:px-10 rounded-none relative">
            {/* Form */}
            <form className="space-y-6" onSubmit={handleAuth}>
              <AnimatePresence mode="popLayout">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label htmlFor="name" className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <input
                        id="name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-border bg-background-cream text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary text-sm rounded-none transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label htmlFor="email" className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-border bg-background-cream text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary text-sm rounded-none transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-border bg-background-cream text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary text-sm rounded-none transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>



              <div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3.5 text-xs uppercase tracking-[0.2em] font-medium"
                >
                  {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Register'}
                </Button>
              </div>
            </form>

            {/* Divider */}
            <div className="mt-8 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-card text-muted-foreground">or continue with</span>
              </div>
            </div>

            {/* Google Auth Button */}
            <div className="mt-6">
              <GoogleAuthButton />
            </div>

            <div className="mt-8 pt-6 border-t border-border flex items-center justify-between text-xs flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-muted-foreground hover:text-foreground underline transition-colors"
              >
                {isLogin ? "Don't have an account? Sign Up" : 'Already registered? Sign In'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
