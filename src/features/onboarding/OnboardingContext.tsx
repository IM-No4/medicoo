import React, { createContext, useContext, useState } from 'react';

type OnboardingData = {
  name?: string;
  gender?: 'male' | 'female' | 'other';
  dob?: string;
  age?: string;
  height?: string;
  weight?: string;
  blood?: string;
  avatar?: string;
};

type ContextType = {
  data: OnboardingData;
  update: (values: Partial<OnboardingData>) => void;
};

const OnboardingContext = createContext<ContextType | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingData>({});

  const update = (values: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...values }));
  };

  return (
    <OnboardingContext.Provider value={{ data, update }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used inside OnboardingProvider');
  }
  return ctx;
}
