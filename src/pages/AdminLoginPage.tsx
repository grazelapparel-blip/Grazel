import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Lock, Shield, Sparkles, Eye, EyeOff } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function AdminLoginPage() {
  const { adminSignIn, adminSignOut } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const success = await adminSignIn(email, password);
      if (success) {
        toast.success('Admin login successful!');
        navigate('/admin', { replace: true });
      } else {
        toast.error('Admin login failed. Check your credentials.');
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
          
          <div className="flex items-center justify-center mb-6">
            <Shield className="h-8 w-8 text-primary" />
          </div>

          <h2 className="font-serif text-4xl text-center text-foreground tracking-tight">
            Admin Portal
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Administrator access only
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
          <div className="bg-card border border-border px-8 py-10 shadow-mega sm:px-10 rounded-none relative">
            {/* Form */}
            <form className="space-y-6" onSubmit={handleAdminLogin}>
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
                    placeholder="admin@example.com"
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
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-10 py-3 border border-border bg-background-cream text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary text-sm rounded-none transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3.5 text-xs uppercase tracking-[0.2em] font-medium"
                >
                  {loading ? 'Processing...' : 'Sign In as Admin'}
                </Button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-border text-center">
              <div className="text-muted-foreground flex items-center justify-center gap-1 text-[11px]">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Demo Admin login: admin@grazel.com / admin123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
