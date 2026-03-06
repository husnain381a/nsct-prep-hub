import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 'default', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600 mb-4`} />
      <p className="text-gray-600 text-lg">{text}</p>
    </div>
  );
};

export default LoadingSpinner;