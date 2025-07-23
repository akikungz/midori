
export interface LoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
}

export const FullScreenLoading: React.FC<LoadingProps> = ({ isLoading, children }) => {
  if (!isLoading) return children;

  return (
    <div className="flex items-center justify-center h-screen w-screen relative">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500" />
    </div>
  );
};

export const Loading: React.FC<LoadingProps> = ({ isLoading, children }) => {
  if (!isLoading) return children;

  return (
    <div className="flex items-center justify-center h-full w-full relative">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 absolute" />
    </div>
  );
};