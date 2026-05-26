import React, { createContext, useContext, useState } from 'react';

interface FitProfileData {
  id?: string;
  type: 'simple' | 'detailed' | null;
  height?: number;
  weight?: number;
  chest?: number;
  shoulderWidth?: number;
  waist?: number;
  hip?: number;
  bicep?: number;
  wrist?: number;
  armLength?: number;
  garmentLength?: number;
  recommendedSize?: string;
}

interface FitContextType {
  fitProfile: FitProfileData;
  setFitProfile: (profile: FitProfileData) => void;
  saveFitProfile: (profile: FitProfileData) => Promise<void>;
  loadUserFitProfile: () => Promise<void>;
  loading: boolean;
}

const FitContext = createContext<FitContextType | undefined>(undefined);

export function FitProvider({ children }: { children: React.ReactNode }) {
  const [fitProfile, setFitProfile] = useState<FitProfileData>({
    type: null,
  });
  const [loading, setLoading] = useState(false);

  const saveFitProfile = async (profile: FitProfileData) => {
    setLoading(true);
    const token = localStorage.getItem('grazel_token');
    const userId = localStorage.getItem('grazel_user_id');

    try {
      const payload = {
        ...profile,
        userId: userId || null,
      };

      const response = await fetch('/api/fit-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save fit profile');
      }

      const savedProfile = await response.json();
      setFitProfile(savedProfile);
      
      // Store profile ID in localStorage for offline reference
      localStorage.setItem('grazel_fit_profile_id', savedProfile.id);
    } catch (err: any) {
      console.error('Error saving fit profile:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadUserFitProfile = async () => {
    setLoading(true);
    const token = localStorage.getItem('grazel_token');

    try {
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/fit-profile/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data) {
          setFitProfile(data);
        }
      }
    } catch (err) {
      console.error('Error loading fit profile:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FitContext.Provider
      value={{
        fitProfile,
        setFitProfile,
        saveFitProfile,
        loadUserFitProfile,
        loading,
      }}
    >
      {children}
    </FitContext.Provider>
  );
}

export function useFit() {
  const context = useContext(FitContext);
  if (!context) {
    throw new Error('useFit must be used within a FitProvider');
  }
  return context;
}
