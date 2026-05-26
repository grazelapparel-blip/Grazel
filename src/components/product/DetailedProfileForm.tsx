import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFit } from '@/context/FitContext';
import { toast } from 'sonner';

interface DetailedProfileFormProps {
  onBack: () => void;
  onSuccess: (recommendedSize: string) => void;
}

export function DetailedProfileForm({ onBack, onSuccess }: DetailedProfileFormProps) {
  const { saveFitProfile } = useFit();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ size: string; note: string } | null>(null);
  
  const [measurements, setMeasurements] = useState({
    chest: '',
    shoulderWidth: '',
    waist: '',
    hip: '',
    bicep: '',
    wrist: '',
    armLength: '',
    garmentLength: '',
  });

  const calculateSize = (chest: number): { size: string; note: string } => {
    let size = 'M';
    let note = '';

    // Size calculation based on chest measurement
    if (chest < 84) {
      size = 'XS';
      note = `Your ${chest}cm chest measurement indicates XS — a fitted silhouette with a close cut through the shoulders and body.`;
    } else if (chest < 92) {
      size = 'S';
      note = `Your ${chest}cm chest measurement indicates S — a slim fit offering a tailored, refined silhouette.`;
    } else if (chest < 100) {
      size = 'M';
      note = `Your ${chest}cm chest measurement indicates M — a regular fit providing balanced proportion and versatility.`;
    } else if (chest < 108) {
      size = 'L';
      note = `Your ${chest}cm chest measurement indicates L — a comfortable fit with generous room for movement.`;
    } else if (chest < 116) {
      size = 'XL';
      note = `Your ${chest}cm chest measurement indicates XL — designed for a fuller frame with ease through the chest and body.`;
    } else {
      size = 'XXL';
      note = `Your ${chest}cm chest measurement indicates XXL — an accommodating fit for maximum comfort and proportion.`;
    }

    return { size, note };
  };

  const handleChange = (field: string, value: string) => {
    setMeasurements(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields are filled
    if (!measurements.chest || !measurements.shoulderWidth || !measurements.waist || 
        !measurements.hip || !measurements.bicep || !measurements.wrist || 
        !measurements.armLength || !measurements.garmentLength) {
      toast.error('Please fill in all measurements');
      return;
    }

    const chest = parseInt(measurements.chest);
    if (chest < 50 || chest > 150) {
      toast.error('Please enter a valid chest measurement');
      return;
    }

    setLoading(true);

    try {
      const { size } = calculateSize(chest);

      // Save to database
      await saveFitProfile({
        type: 'detailed',
        chest,
        shoulderWidth: parseInt(measurements.shoulderWidth),
        waist: parseInt(measurements.waist),
        hip: parseInt(measurements.hip),
        bicep: parseInt(measurements.bicep),
        wrist: parseInt(measurements.wrist),
        armLength: parseInt(measurements.armLength),
        garmentLength: parseInt(measurements.garmentLength),
        recommendedSize: size,
      });

      toast.success('Fit profile saved successfully!');
      const result = calculateSize(chest);
      setResult(result);
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
            Curate Your Fit
          </h1>

          <p className="text-muted-foreground mb-8">
            Enter your measurements in centimeters for a precise fit recommendation.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h2 className="font-serif text-xl text-foreground mb-6 border-b border-border pb-4">
                Top Measurements
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-3">
                  <label htmlFor="chest" className="block text-sm font-medium text-foreground uppercase tracking-wider">
                    Chest/Bust (cm)
                  </label>
                  <input
                    id="chest"
                    type="number"
                    value={measurements.chest}
                    onChange={(e) => handleChange('chest', e.target.value)}
                    placeholder="e.g., 96"
                    className="w-full px-4 py-3 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm"
                  />
                </div>

                <div className="space-y-3">
                  <label htmlFor="shoulderWidth" className="block text-sm font-medium text-foreground uppercase tracking-wider">
                    Shoulder Width (cm)
                  </label>
                  <input
                    id="shoulderWidth"
                    type="number"
                    value={measurements.shoulderWidth}
                    onChange={(e) => handleChange('shoulderWidth', e.target.value)}
                    placeholder="e.g., 45"
                    className="w-full px-4 py-3 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-3">
                  <label htmlFor="waist" className="block text-sm font-medium text-foreground uppercase tracking-wider">
                    Waist (cm)
                  </label>
                  <input
                    id="waist"
                    type="number"
                    value={measurements.waist}
                    onChange={(e) => handleChange('waist', e.target.value)}
                    placeholder="e.g., 82"
                    className="w-full px-4 py-3 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm"
                  />
                </div>

                <div className="space-y-3">
                  <label htmlFor="hip" className="block text-sm font-medium text-foreground uppercase tracking-wider">
                    Hip (cm)
                  </label>
                  <input
                    id="hip"
                    type="number"
                    value={measurements.hip}
                    onChange={(e) => handleChange('hip', e.target.value)}
                    placeholder="e.g., 98"
                    className="w-full px-4 py-3 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label htmlFor="bicep" className="block text-sm font-medium text-foreground uppercase tracking-wider">
                    Bicep (cm)
                  </label>
                  <input
                    id="bicep"
                    type="number"
                    value={measurements.bicep}
                    onChange={(e) => handleChange('bicep', e.target.value)}
                    placeholder="e.g., 32"
                    className="w-full px-4 py-3 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm"
                  />
                </div>

                <div className="space-y-3">
                  <label htmlFor="wrist" className="block text-sm font-medium text-foreground uppercase tracking-wider">
                    Wrist (cm)
                  </label>
                  <input
                    id="wrist"
                    type="number"
                    value={measurements.wrist}
                    onChange={(e) => handleChange('wrist', e.target.value)}
                    placeholder="e.g., 17"
                    className="w-full px-4 py-3 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-serif text-xl text-foreground mb-6 border-b border-border pb-4">
                Length Measurements
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label htmlFor="armLength" className="block text-sm font-medium text-foreground uppercase tracking-wider">
                    Arm Length (cm)
                  </label>
                  <input
                    id="armLength"
                    type="number"
                    value={measurements.armLength}
                    onChange={(e) => handleChange('armLength', e.target.value)}
                    placeholder="e.g., 62"
                    className="w-full px-4 py-3 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm"
                  />
                </div>

                <div className="space-y-3">
                  <label htmlFor="garmentLength" className="block text-sm font-medium text-foreground uppercase tracking-wider">
                    Garment Length (cm)
                  </label>
                  <input
                    id="garmentLength"
                    type="number"
                    value={measurements.garmentLength}
                    onChange={(e) => handleChange('garmentLength', e.target.value)}
                    placeholder="e.g., 72"
                    className="w-full px-4 py-3 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="py-6 text-base uppercase tracking-wider"
              >
                Back
              </Button>

              <Button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-medium py-6 text-base uppercase tracking-wider"
              >
                {loading ? 'Processing...' : 'Get My Fit'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
