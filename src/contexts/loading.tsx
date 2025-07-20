import { createContext, useState } from "react";

export interface LoadingContext {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export const LoadingContext = createContext<LoadingContext>({
  isLoading: false,
  setIsLoading: () => {},
});

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};