"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Context to handle SPA-like state
interface SPAContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const SPAContext = createContext<SPAContextType>({
  isLoading: false,
  setIsLoading: () => {},
});

export const useSPA = () => useContext(SPAContext);

interface SPAProviderProps {
  children: ReactNode;
}

export function SPAProvider({ children }: SPAProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track route changes to show loading state
  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams]);

  return (
    <SPAContext.Provider value={{ isLoading, setIsLoading }}>
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-primary animate-pulse" />
      )}
      {children}
    </SPAContext.Provider>
  );
}

// Navigation event handler to show loading state
export function onNavigate(callback?: () => void) {
  const { setIsLoading } = useSPA();
  
  return () => {
    setIsLoading(true);
    if (callback) callback();
  };
} 