import React, { useState } from 'react';
import { FitProfileSelection } from '@/components/product/FitProfileSelection';
import { SimpleProfileForm } from '@/components/product/SimpleProfileForm';
import { DetailedProfileForm } from '@/components/product/DetailedProfileForm';

type FitStep = 'selection' | 'simple' | 'detailed' | 'result';

interface FitProfilePageProps {
  onClose?: () => void;
  onSuccess?: (size: string) => void;
}

export function FitProfilePage({ onClose, onSuccess }: FitProfilePageProps) {
  const [step, setStep] = useState<FitStep>('selection');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const handleSelectSimple = () => {
    setStep('simple');
  };

  const handleSelectDetailed = () => {
    setStep('detailed');
  };

  const handleBack = () => {
    setStep('selection');
    setSelectedSize(null);
  };

  const handleSuccess = (size: string) => {
    setSelectedSize(size);
    setStep('result');
    if (onSuccess) {
      onSuccess(size);
    }
  };

  return (
    <div>
      {step === 'selection' && (
        <FitProfileSelection
          onSelectSimple={handleSelectSimple}
          onSelectDetailed={handleSelectDetailed}
        />
      )}

      {step === 'simple' && (
        <SimpleProfileForm
          onBack={handleBack}
          onSuccess={handleSuccess}
        />
      )}

      {step === 'detailed' && (
        <DetailedProfileForm
          onBack={handleBack}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
