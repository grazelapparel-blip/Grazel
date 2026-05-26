import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useFit } from '@/context/FitContext';

interface FitProfileSelectionProps {
  onSelectSimple: () => void;
  onSelectDetailed: () => void;
}

export function FitProfileSelection({ onSelectSimple, onSelectDetailed }: FitProfileSelectionProps) {
  return (
    <div className="min-h-screen bg-background-cream py-16">
      <div className="container max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="font-serif text-4xl lg:text-5xl text-foreground mb-4">
            Find Your Perfect Fit
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose how you'd like to find your ideal size
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Simple Fit Profile Card */}
          <div className="bg-card border border-border p-8 shadow-mega hover:shadow-lg transition-shadow">
            <h2 className="font-serif text-2xl text-foreground mb-4">
              Simple Fit Profile
            </h2>
            <p className="text-muted-foreground mb-6">
              Quick size recommendation based on your general measurements and preferences.
            </p>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3">
                <span className="text-primary">✓</span>
                <span className="text-sm text-foreground">Takes only 2 minutes</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-primary">✓</span>
                <span className="text-sm text-foreground">Basic height & weight info</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-primary">✓</span>
                <span className="text-sm text-foreground">AI-powered recommendations</span>
              </li>
            </ul>

            <Button
              onClick={onSelectSimple}
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-6 text-base uppercase tracking-wider"
            >
              Get Started
            </Button>
          </div>

          {/* Curate Your Fit Card (Recommended) */}
          <div className="relative border-2 border-primary bg-card p-8 shadow-mega hover:shadow-lg transition-shadow">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 text-xs font-bold uppercase tracking-wider">
              Recommended
            </div>
            
            <h2 className="font-serif text-2xl text-foreground mb-4">
              Curate Your Fit
            </h2>
            <p className="text-muted-foreground mb-6">
              Detailed measurements for a precise, tailored fit recommendation.
            </p>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3">
                <span className="text-primary">📏</span>
                <span className="text-sm text-foreground">Chest, shoulders, arms & more</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-primary">✓</span>
                <span className="text-sm text-foreground">Most accurate fit</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-primary">✓</span>
                <span className="text-sm text-foreground">Tailored to this product</span>
              </li>
            </ul>

            <Button
              onClick={onSelectDetailed}
              className="w-full bg-secondary hover:bg-secondary/90 text-white font-medium py-6 text-base uppercase tracking-wider"
            >
              Curate Your Fit
            </Button>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Your data is securely stored and never shared with third parties.
          </p>
        </div>
      </div>
    </div>
  );
}
