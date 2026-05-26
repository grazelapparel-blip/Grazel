import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFit } from '@/context/FitContext';
import { toast } from 'sonner';

interface SimpleProfileFormProps {
  onBack: () => void;
  onSuccess: (recommendedSize: string) => void;
}

export function SimpleProfileForm({ onBack, onSuccess }: SimpleProfileFormProps) {
  const { saveFitProfile } = useFit();
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ size: string; note: string } | null>(null);

  const calculateSize = (h: number, w: number): { size: string; note: string } => {
    let size = 'M';
    let note = '';

    // Size calculation based on height and weight
    if (h < 165) {
      if (w < 55) {
        size = 'XS';
        note = `At ${h}cm and ${w}kg, you fall into the XS range for a comfortable, fitted silhouette.`;
      } else if (w < 65) {
        size = 'S';
        note = `At ${h}cm and ${w}kg, size S is recommended for an optimal fit.`;
      } else {
        size = 'M';
        note = `At ${h}cm and ${w}kg, size M offers a balanced fit with room for layering.`;
      }
    } else if (h < 175) {
      if (w < 65) {
        size = 'S';
        note = `At ${h}cm and ${w}kg, you fall into the S range for a tailored fit.`;
      } else if (w < 80) {
        size = 'M';
        note = `At ${h}cm and ${w}kg, size M is recommended for a comfortable fit.`;
      } else {
        size = 'L';
        note = `At ${h}cm and ${w}kg, size L provides ample room for movement.`;
      }
    } else if (h < 185) {
      if (w < 75) {
        size = 'M';
        note = `At ${h}cm and ${w}kg, size M is suitable for your frame.`;
      } else if (w < 90) {
        size = 'L';
        note = `At ${h}cm and ${w}kg, size L is recommended for an ideal fit.`;
      } else {
        size = 'XL';
        note = `At ${h}cm and ${w}kg, size XL offers comfort and proportion.`;
      }
    } else {
      if (w < 85) {
        size = 'L';
        note = `At ${h}cm and ${w}kg, size L provides proper proportions.`;
      } else if (w < 100) {
        size = 'XL';
        note = `At ${h}cm and ${w}kg, size XL is recommended for an optimal fit.`;
      } else {
        size = 'XXL';
        note = `At ${h}cm and ${w}kg, size XXL ensures comfort and proper fit.`;
      }
    }

    return { size, note };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const h = parseInt(height);
    const w = parseInt(weight);

    if (!h || !w) {
      toast.error('Please enter both height and weight');
      return;
    }

    if (h < 120 || h > 230) {
      toast.error('Please enter a valid height (120-230 cm)');
      return;
    }

    if (w < 30 || w > 200) {
      toast.error('Please enter a valid weight (30-200 kg)');
      return;
    }

    setLoading(true);

    try {
      const { size } = calculateSize(h, w);
      
      // Save to database
      await saveFitProfile({
        type: 'simple',
        height: h,
        weight: w,
        recommendedSize: size,
      });

      toast.success('Fit profile saved successfully!');
      const { size: recommendedSize, note } = calculateSize(h, w);
      setResult({ size: recommendedSize, note });
    } catch (err: any) {
      console.error('Error saving fit profile:', err);
      toast.error('Failed to save fit profile');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-background-cream py-16"
      >
        <div className="container max-w-2xl">
          <button
            onClick={onBack}
            className="mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="bg-card border border-border p-12 text-center shadow-mega">
            <div className="mb-6 flex justify-center">
              <div className="h-20 w-20 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-4xl font-bold">
                {result.size}
              </div>
            </div>

            <h1 className="font-serif text-3xl lg:text-4xl text-foreground mb-6">
              Your Recommended Size
            </h1>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              {result.note}
            </p>

            <div className="space-y-4">
              <Button
                onClick={() => onSuccess(result.size)}
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-6 text-base uppercase tracking-wider gap-2"
              >
                <Check className="h-5 w-5" />
                Use This Size
              </Button>

              <Button
                variant="outline"
                onClick={onBack}
                className="w-full py-6 text-base uppercase tracking-wider"
              >
                Try Again
              </Button>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground">
              Want more precise measurements?{' '}
              <button
                onClick={onBack}
                className="text-primary hover:underline font-medium"
              >
                Curate Your Fit
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-background-cream py-16"
    >
      <div className="container max-w-2xl">
        <button
          onClick={onBack}
          className="mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="bg-card border border-border p-8 shadow-mega">
          <h1 className="font-serif text-3xl lg:text-4xl text-foreground mb-2">
            Fit Intelligence
          </h1>

          <div className="flex gap-2 mb-8 text-sm uppercase tracking-wider text-muted-foreground">
            <span className="text-primary font-medium">BODY</span>
            <span>→</span>
            <span>MEASUREMENTS</span>
            <span>→</span>
            <span>RESULT</span>
          </div>

          <p className="text-muted-foreground mb-8">
            Tell us about your body. We'll recommend the most accurate size for this piece.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label htmlFor="height" className="block text-sm font-medium text-foreground uppercase tracking-wider">
                Height (CM)
              </label>
              <p className="text-xs text-muted-foreground">Your height in centimeters</p>
              <input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g., 178"
                className="w-full px-4 py-3 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm"
              />
            </div>

            <div className="space-y-3">
              <label htmlFor="weight" className="block text-sm font-medium text-foreground uppercase tracking-wider">
                Weight (KG)
              </label>
              <p className="text-xs text-muted-foreground">Your weight in kilograms</p>
              <input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g., 72"
                className="w-full px-4 py-3 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !height || !weight}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-medium py-6 text-base uppercase tracking-wider"
            >
              {loading ? 'Processing...' : 'Continue'}
            </Button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
