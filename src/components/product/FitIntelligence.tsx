import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFit } from '@/context/FitContext';
import { toast } from 'sonner';

interface FitIntelligenceProps {
  isOpen: boolean;
  onClose: () => void;
  sizes: string[];
  onRecommend: (size: string) => void;
  tailoredFitMeasurements?: string[];
}

type Measurements = {
  height: string;
  weight: string;
  chest: string;
  waist: string;
  shoulderWidth: string;
  hip: string;
  bicep: string;
  wrist: string;
  armLength: string;
  garmentLength: string;
  fitPref: 'slim' | 'regular' | 'relaxed' | '';
  bodyType: 'athletic' | 'regular' | 'relaxed' | '';
  selectedSize: string;
};

const steps = ['Body', 'Measurements', 'Preference', 'Body Type', 'Result'] as const;

export function FitIntelligence({ isOpen, onClose, sizes, onRecommend, tailoredFitMeasurements }: FitIntelligenceProps) {
  const { saveFitProfile } = useFit();
  const [mode, setMode] = useState<'selection' | 'simple' | 'detailed'>('selection');
  const [step, setStep] = useState(0);
  const [m, setM] = useState<Measurements>({
    height: '', weight: '', chest: '', waist: '', shoulderWidth: '', hip: '', bicep: '', wrist: '', armLength: '', garmentLength: '', fitPref: '', bodyType: '', selectedSize: '',
  });
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [tailoredValues, setTailoredValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);

  // Fetch measurement details when component opens with tailoredFitMeasurements
  useEffect(() => {
    if (isOpen && tailoredFitMeasurements && tailoredFitMeasurements.length > 0) {
      fetchMeasurementDetails();
    }
  }, [isOpen, tailoredFitMeasurements]);

  const fetchMeasurementDetails = async () => {
    setLoadingMeasurements(true);
    try {
      const response = await fetch('/api/measurements');
      if (response.ok) {
        const allMeasurements = await response.json();
        // Filter to only show the selected measurements
        const filtered = allMeasurements.filter((m: any) => tailoredFitMeasurements?.includes(m.id));
        setMeasurements(filtered);
      }
    } catch (err) {
      console.error('Error fetching measurements:', err);
    } finally {
      setLoadingMeasurements(false);
    }
  };

  const reset = () => { 
    setMode('selection');
    setStep(0); 
    setM({ height: '', weight: '', chest: '', waist: '', shoulderWidth: '', hip: '', bicep: '', wrist: '', armLength: '', garmentLength: '', fitPref: '', bodyType: '', selectedSize: '' }); 
    setTailoredValues({});
    setSelectedSize(''); 
    setSaving(false); 
  };

  // Save fit profile to database
  const saveMeasurements = async (finalSize: string) => {
    setSaving(true);
    try {
      const height = parseInt(m.height);
      const weight = parseInt(m.weight);
      
      // In simple mode, estimate chest from height/weight
      let chest = parseInt(m.chest);
      let waist = parseInt(m.waist);
      
      if (mode === 'simple') {
        // Estimate chest and waist based on height and weight
        // Using simple BMI-based estimation
        const bmi = weight / ((height / 100) ** 2);
        chest = Math.round(height * 0.52 + (bmi - 22) * 2);
        waist = Math.round(height * 0.42 + (bmi - 22) * 1.5);
      }
      
      await saveFitProfile({
        type: mode === 'simple' ? 'simple' : 'detailed',
        height,
        weight,
        chest,
        waist,
        recommendedSize: finalSize,
      });
      toast.success('Fit profile saved!');
    } catch (err) {
      console.error('Error saving fit profile:', err);
      toast.error('Failed to save fit profile');
    } finally {
      setSaving(false);
    }
  };

  // Rule-based size recommendation with detailed rationale
  const recommend = (): { size: string; confidence: number; note: string } => {
    let chest = parseInt(m.chest) || 0;
    let waist = parseInt(m.waist) || 0;
    const height = parseInt(m.height) || 0;
    const weight = parseInt(m.weight) || 0;
    
    // For simple mode, estimate chest and waist
    if (mode === 'simple' && (chest === 0 || waist === 0)) {
      const bmi = weight / ((height / 100) ** 2);
      chest = Math.round(height * 0.52 + (bmi - 22) * 2);
      waist = Math.round(height * 0.42 + (bmi - 22) * 1.5);
    }
    
    let size = sizes[Math.floor(sizes.length / 2)] ?? 'M';
    let rationale = '';
    
    // Size mapping based on chest measurement (primary factor)
    if (chest < 92) {
      size = sizes.includes('XS') ? 'XS' : sizes[0];
      rationale = `Your ${chest}cm chest measurement suggests XS`;
    } else if (chest < 97) {
      size = 'S';
      rationale = `Your ${chest}cm chest measurement suggests S`;
    } else if (chest < 102) {
      size = 'M';
      rationale = `Your ${chest}cm chest measurement suggests M`;
    } else if (chest < 107) {
      size = 'L';
      rationale = `Your ${chest}cm chest measurement suggests L`;
    } else if (chest < 112) {
      size = 'XL';
      rationale = `Your ${chest}cm chest measurement suggests XL`;
    } else {
      size = sizes.includes('XXL') ? 'XXL' : sizes[sizes.length - 1];
      rationale = `Your ${chest}cm chest measurement suggests XL+`;
    }
    
    // Adjust based on fit preference
    const fitAdjustments = {
      slim: ' — a slim fit will have a closer cut through the chest',
      regular: ' — a regular fit will have a comfortable, balanced silhouette',
      relaxed: ' — a relaxed fit will have generous room for easy movement'
    };
    
    // Ensure size exists in available sizes
    if (!sizes.includes(size)) {
      size = sizes[0];
    }
    
    // Confidence calculation based on waist/chest ratio and height
    let confidence = mode === 'simple' ? 78 : 92; // Lower confidence for simple mode estimates
    if (chest > 0 && waist > 0) {
      const chestWaistRatio = waist / chest;
      if (chestWaistRatio < 0.8 || chestWaistRatio > 0.95) {
        confidence = Math.max(confidence - 7, 70); // Lower confidence for unusual proportions
      }
    }
    
    const fullNote = rationale + (m.fitPref ? fitAdjustments[m.fitPref] : '. A regular fit offers versatility.');
    
    return {
      size,
      confidence,
      note: fullNote,
    };
  };

  const canNext = () => {
    if (mode === 'simple') {
      // Simple: Height/Weight/Size → Body Type → Fit Preference
      if (step === 0) return m.height && m.weight && m.selectedSize;
      if (step === 1) return m.bodyType;
      if (step === 2) return m.fitPref;
      return true;
    } else {
      // Detailed: 8 Measurements → Fit Preference → Body Type
      if (step === 0) return m.chest && m.waist && m.shoulderWidth && m.hip && m.bicep && m.wrist && m.armLength && m.garmentLength;
      if (step === 1) return m.fitPref;
      if (step === 2) return m.bodyType;
      return true;
    }
  };

  const close = () => { onClose(); setTimeout(reset, 300); };

  const rec = step === 3 ? recommend() : null;
  const displaySize = selectedSize || rec?.size;

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-foreground/40" onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[560px] bg-card shadow-mega max-h-[90vh] overflow-y-auto rounded-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <Ruler className="h-4 w-4 text-primary" />
                <h2 className="font-serif text-xl">Fit Intelligence</h2>
              </div>
              <button onClick={close} aria-label="Close" className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stepper - Only show in detailed mode */}
            {mode === 'detailed' && (
            <div className="px-6 pt-6">
              <div className="flex items-center gap-2">
                {['MEASUREMENTS', 'PREFERENCE', 'BODY TYPE', 'RESULT'].map((s, i) => (
                  <div key={s} className="flex items-center flex-1">
                    <div className={`h-px flex-1 transition-colors ${i <= step ? 'bg-primary' : 'bg-border'}`} />
                    <span className={`mx-2 text-xs uppercase tracking-[0.15em] ${i === step ? 'text-primary' : 'text-muted-foreground'}`}>
                      {s}
                    </span>
                    {i === 3 && (
                      <div className={`h-px flex-1 transition-colors ${i < step ? 'bg-primary' : 'bg-border'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            )}
            {mode === 'simple' && (
            <div className="px-6 pt-6">
              <div className="flex items-center gap-2">
                {['SIZE', 'BODY TYPE', 'FIT PREFERENCE', 'RESULT'].map((s, i) => (
                  <div key={s} className="flex items-center flex-1">
                    <div className={`h-px flex-1 transition-colors ${i <= step ? 'bg-primary' : 'bg-border'}`} />
                    <span className={`mx-2 text-xs uppercase tracking-[0.15em] ${i === step ? 'text-primary' : 'text-muted-foreground'}`}>
                      {s}
                    </span>
                    {i === 3 && (
                      <div className={`h-px flex-1 transition-colors ${i < step ? 'bg-primary' : 'bg-border'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            )}

            {/* Step content */}
            <div className="p-6 min-h-[280px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode === 'selection' ? 'selection' : step}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Selection Screen */}
                  {mode === 'selection' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-serif text-2xl mb-2">Find Your Perfect Fit</h3>
                        <p className="text-sm text-muted-foreground">Choose how you'd like to find your ideal size</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Get Started - Simple */}
                        <button
                          onClick={() => {
                            setMode('simple');
                            setStep(0);
                          }}
                          className="p-6 border-2 border-border hover:border-primary text-left transition-all group"
                        >
                          <div className="font-serif text-lg mb-3">Get Started</div>
                          <ul className="space-y-2">
                            <li className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-0.5">✓</span> Takes only 2 minutes
                            </li>
                            <li className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-0.5">✓</span> Basic height & weight
                            </li>
                            <li className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-0.5">✓</span> AI-powered
                            </li>
                          </ul>
                        </button>

                        {/* Curate Your Fit - Detailed */}
                        <button
                          onClick={() => {
                            setMode('detailed');
                            setStep(0);
                          }}
                          className="p-6 border-2 border-primary bg-primary/5 text-left transition-all"
                        >
                          <div className="text-xs font-medium text-primary uppercase tracking-[0.1em] mb-2">RECOMMENDED</div>
                          <div className="font-serif text-lg mb-3">Curate Your Fit</div>
                          <ul className="space-y-2">
                            <li className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-0.5">✓</span> Detailed measurements
                            </li>
                            <li className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-0.5">✓</span> Most accurate fit
                            </li>
                            <li className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-0.5">✓</span> Tailored to this product
                            </li>
                          </ul>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Detailed Flow */}
                  {mode === 'detailed' && (
                  <>
                  {step === 0 && (
                    <div className="space-y-6">
                      {tailoredFitMeasurements && tailoredFitMeasurements.length > 0 ? (
                        <>
                          <p className="text-sm text-muted-foreground">
                            Measure over a fitted t-shirt. Keep the tape level and snug, not tight.
                          </p>
                          {loadingMeasurements ? (
                            <div className="text-center py-8 text-sm text-muted-foreground">Loading measurements...</div>
                          ) : measurements.length > 0 ? (
                            <div className="grid grid-cols-2 gap-6">
                              {measurements.map((measurement) => (
                                <Field 
                                  key={measurement.id}
                                  label={`${measurement.name} (cm)`} 
                                  value={tailoredValues[measurement.id] || ''} 
                                  onChange={(v) => setTailoredValues({ ...tailoredValues, [measurement.id]: v })} 
                                  placeholder={measurement.datatype === 'decimal' ? '75.5' : '75'}
                                  hint={measurement.description}
                                  min={20}
                                  max={150}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-sm text-muted-foreground">No tailored measurements available for this product</div>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground">
                            Measure over a fitted t-shirt. Keep the tape level and snug, not tight.
                          </p>
                          <div className="grid grid-cols-2 gap-6">
                            <Field 
                              label="Chest/Bust (cm)" 
                              value={m.chest} 
                              onChange={(v) => setM({ ...m, chest: v })} 
                              placeholder="98"
                              hint="Measure around the fullest part"
                              min={70}
                              max={130}
                            />
                            <Field 
                              label="Shoulder Width (cm)" 
                              value={m.shoulderWidth} 
                              onChange={(v) => setM({ ...m, shoulderWidth: v })} 
                              placeholder="45"
                              hint="Across shoulders"
                              min={30}
                              max={60}
                            />
                            <Field 
                              label="Waist (cm)" 
                              value={m.waist} 
                              onChange={(v) => setM({ ...m, waist: v })} 
                              placeholder="82"
                              hint="At natural waist"
                              min={60}
                              max={120}
                            />
                            <Field 
                              label="Hip (cm)" 
                              value={m.hip} 
                              onChange={(v) => setM({ ...m, hip: v })} 
                              placeholder="98"
                              hint="Around fullest part"
                              min={70}
                              max={130}
                            />
                            <Field 
                              label="Bicep (cm)" 
                              value={m.bicep} 
                              onChange={(v) => setM({ ...m, bicep: v })} 
                              placeholder="32"
                              hint="Around upper arm"
                              min={20}
                              max={50}
                            />
                            <Field 
                              label="Wrist (cm)" 
                              value={m.wrist} 
                              onChange={(v) => setM({ ...m, wrist: v })} 
                              placeholder="17"
                              hint="Around wrist"
                              min={13}
                              max={25}
                            />
                            <Field 
                              label="Arm Length (cm)" 
                              value={m.armLength} 
                              onChange={(v) => setM({ ...m, armLength: v })} 
                              placeholder="62"
                              hint="Shoulder to wrist"
                              min={50}
                              max={80}
                            />
                            <Field 
                              label="Garment Length (cm)" 
                              value={m.garmentLength} 
                              onChange={(v) => setM({ ...m, garmentLength: v })} 
                              placeholder="72"
                              hint="Shoulder to hem"
                              min={50}
                              max={90}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  {step === 1 && (
                    <div className="space-y-5">
                      <p className="text-sm text-muted-foreground">How do you prefer your garments to sit?</p>
                      <div className="grid grid-cols-3 gap-3">
                        {(['slim', 'regular', 'relaxed'] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => setM({ ...m, fitPref: f })}
                            className={`p-4 border text-sm capitalize transition-colors ${
                              m.fitPref === f ? 'border-primary text-primary bg-primary/5' : 'border-border hover:border-primary'
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {step === 2 && (
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-foreground mb-5">Select Your Body Type</p>
                      <div className="space-y-3">
                        {[
                          { id: 'athletic', label: 'Athletic', desc: 'Broad shoulders, defined waist' },
                          { id: 'regular', label: 'Regular', desc: 'Balanced proportions' },
                          { id: 'relaxed', label: 'Relaxed', desc: 'Comfortable, natural build' },
                        ].map((bt) => (
                          <button
                            key={bt.id}
                            onClick={() => setM({ ...m, bodyType: bt.id as 'athletic' | 'regular' | 'relaxed' })}
                            className={`w-full p-4 border text-left transition-colors ${
                              m.bodyType === bt.id 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-primary'
                            }`}
                          >
                            <div className="font-medium text-foreground">{bt.label}</div>
                            <div className={`text-sm mt-1 ${m.bodyType === bt.id ? 'text-primary' : 'text-muted-foreground'}`}>
                              {bt.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {step === 3 && rec && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4 font-medium">Recommended Size</p>
                        <div className="font-serif text-7xl text-primary mb-4 font-bold">{rec.size}</div>
                        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-primary" />
                          {rec.confidence}% confidence match
                        </div>
                      </div>

                      <div className="border-t border-b border-border py-6">
                        <p className="text-sm text-muted-foreground mb-4 text-center font-medium">Or Select Your Size</p>
                        <div className="grid grid-cols-4 gap-3">
                          {sizes.map((size) => (
                            <button
                              key={size}
                              onClick={() => handleSizeSelect(size)}
                              className={`p-3 border-2 text-sm font-medium uppercase transition-all ${
                                displaySize === size
                                  ? 'border-primary bg-primary/5 text-primary'
                                  : rec.size === size
                                  ? 'border-primary/30 text-foreground hover:border-primary'
                                  : 'border-border text-muted-foreground hover:border-primary'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed text-center">{rec.note}</p>
                    </div>
                  )}
                  </>
                  )}

                  {/* Simple Flow */}
                  {mode === 'simple' && (
                  <>
                  {step === 0 && (
                    <div className="space-y-6">
                      <p className="text-sm text-muted-foreground">
                        Tell us about your body. We'll help you find the best fit.
                      </p>
                      <Field 
                        label="Height (cm)" 
                        value={m.height} 
                        onChange={(v) => setM({ ...m, height: v })} 
                        placeholder="178"
                        hint="Your height in centimeters"
                        min={140}
                        max={220}
                      />
                      <Field 
                        label="Weight (kg)" 
                        value={m.weight} 
                        onChange={(v) => setM({ ...m, weight: v })} 
                        placeholder="72"
                        hint="Your weight in kilograms"
                        min={40}
                        max={150}
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground mb-4">Select Your Size</p>
                        <div className="grid grid-cols-3 gap-3">
                          {sizes.map((size) => (
                            <button
                              key={size}
                              onClick={() => setM({ ...m, selectedSize: size })}
                              className={`p-4 border-2 text-sm font-medium uppercase transition-all ${
                                m.selectedSize === size
                                  ? 'border-primary bg-primary/5 text-primary'
                                  : 'border-border text-muted-foreground hover:border-primary'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {step === 1 && (
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-foreground mb-5">Select Your Body Type</p>
                      <div className="space-y-3">
                        {[
                          { id: 'athletic', label: 'Athletic', desc: 'Broad shoulders, defined waist' },
                          { id: 'regular', label: 'Regular', desc: 'Balanced proportions' },
                          { id: 'relaxed', label: 'Relaxed', desc: 'Comfortable, natural build' },
                        ].map((bt) => (
                          <button
                            key={bt.id}
                            onClick={() => setM({ ...m, bodyType: bt.id as 'athletic' | 'regular' | 'relaxed' })}
                            className={`w-full p-4 border text-left transition-colors ${
                              m.bodyType === bt.id 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-primary'
                            }`}
                          >
                            <div className="font-medium text-foreground">{bt.label}</div>
                            <div className={`text-sm mt-1 ${m.bodyType === bt.id ? 'text-primary' : 'text-muted-foreground'}`}>
                              {bt.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {step === 2 && (
                    <div className="space-y-5">
                      <p className="text-sm font-medium text-foreground mb-5">How do you prefer your garments to sit?</p>
                      <div className="space-y-3">
                        {[
                          { id: 'slim', label: 'Slim Fit', desc: 'Close to body, modern silhouette' },
                          { id: 'regular', label: 'Regular Fit', desc: 'Classic, comfortable fit' },
                          { id: 'relaxed', label: 'Relaxed Fit', desc: 'Generous room, easy wear' },
                        ].map((f) => (
                          <button
                            key={f.id}
                            onClick={() => setM({ ...m, fitPref: f.id as 'slim' | 'regular' | 'relaxed' })}
                            className={`w-full p-4 border text-left transition-colors ${
                              m.fitPref === f.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
                            }`}
                          >
                            <div className="font-medium text-foreground">{f.label}</div>
                            <div className={`text-sm mt-1 ${m.fitPref === f.id ? 'text-primary' : 'text-muted-foreground'}`}>
                              {f.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {step === 3 && mode === 'simple' && (
                    <div className="space-y-6 text-center">
                      <div className="py-8">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                          <Check className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Your Profile is Ready</h3>
                        <p className="text-sm text-muted-foreground mt-2">We've found your perfect size</p>
                      </div>

                      <div className="bg-muted/50 rounded p-6 space-y-3 text-left">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Recommended Size</span>
                          <span className="font-semibold text-foreground">{m.selectedSize}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Fit Confidence</span>
                          <span className="font-semibold text-foreground">78%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Body Type</span>
                          <span className="font-semibold capitalize text-foreground">{m.bodyType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Fit Preference</span>
                          <span className="font-semibold capitalize text-foreground">{m.fitPref} Fit</span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground">Your profile has been saved to your account</p>
                    </div>
                  )}
                  </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            {mode === 'detailed' && (
            <div className="flex items-center justify-between p-6 border-t border-border bg-background-cream">
              {step > 0 && step < 3 ? (
                <button onClick={() => setStep(step - 1)} className="text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground">
                  Back
                </button>
              ) : <span />}

              {step < 3 ? (
                <Button
                  variant="add"
                  disabled={!canNext()}
                  onClick={() => setStep(step + 1)}
                >
                  Continue <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button 
                  variant="add" 
                  disabled={saving}
                  onClick={async () => { 
                    if (displaySize) {
                      await saveMeasurements(displaySize);
                      onRecommend(displaySize);
                      close();
                    }
                  }}
                >
                  {saving ? 'Saving...' : 'Use this size'}
                </Button>
              )}
            </div>
            )}

            {/* Footer - Only show in simple mode */}
            {mode === 'simple' && (
            <div className="flex items-center justify-between p-6 border-t border-border bg-background-cream">
              {step > 0 ? (
                <button onClick={() => setStep(step - 1)} className="text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground">
                  Back
                </button>
              ) : <span />}

              {step < 3 ? (
                <Button
                  variant="add"
                  disabled={!canNext()}
                  onClick={() => setStep(step + 1)}
                >
                  Continue <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button 
                  variant="add" 
                  disabled={saving}
                  onClick={async () => { 
                    await saveMeasurements(m.selectedSize);
                    onRecommend(m.selectedSize);
                    close();
                  }}
                >
                  {saving ? 'Saving...' : `Add to Cart - Size ${m.selectedSize}`}
                </Button>
              )}
            </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, value, onChange, placeholder, hint, min = 0, max = 300 }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; hint?: string; min?: number; max?: number }) {
  const numValue = parseInt(value) || 0;
  const isValid = numValue === 0 || (numValue >= min && numValue <= max);
  const errorMsg = numValue > max ? `Max ${max}cm` : numValue < min ? `Min ${min}cm` : '';
  
  return (
    <label className="block">
      <span className="text-sm uppercase tracking-[0.15em] text-muted-foreground block mb-2">{label}</span>
      {hint && <p className="text-xs text-muted-foreground mb-3 italic">{hint}</p>}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        className={`w-full bg-transparent border-b py-3 text-lg focus:outline-none transition-colors ${
          value && !isValid
            ? 'border-red-500 text-red-600'
            : 'border-border focus:border-primary'
        }`}
        aria-invalid={value && !isValid}
        aria-describedby={value && !isValid ? `error-${label}` : undefined}
      />
      {value && !isValid && (
        <p id={`error-${label}`} className="text-xs text-red-600 mt-2">{errorMsg}</p>
      )}
    </label>
  );
}
