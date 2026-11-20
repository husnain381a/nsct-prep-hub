import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 'default', text = 'Loading...', compact = false }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className={`app-loading ${compact ? '' : 'app-night'}`} role="status">
      <Loader2 className={`${sizeClasses[size]} motion-safe:animate-spin`} aria-hidden="true" />
      <p>{text}</p>
    </div>
  );
};

export default LoadingSpinner;
