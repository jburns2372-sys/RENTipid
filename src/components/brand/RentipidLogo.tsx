import Image from 'next/image';
import { BRAND } from '@/lib/brand';

interface RentipidLogoProps {
  variant?: 'full' | 'icon' | 'wordmark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  priority?: boolean;
}

const sizeConfig = {
  sm: { height: 32, width: 120 },
  md: { height: 56, width: 210 },
  lg: { height: 80, width: 300 },
  xl: { height: 112, width: 420 },
};

const iconSizeConfig = {
  sm: { height: 32, width: 32 },
  md: { height: 56, width: 56 },
  lg: { height: 80, width: 80 },
  xl: { height: 112, width: 112 },
};

export default function RentipidLogo({
  variant = 'full',
  size = 'md',
  showText = false,
  className = '',
  priority = false,
}: RentipidLogoProps) {
  const isIcon = variant === 'icon';
  const dimensions = isIcon ? iconSizeConfig[size] : sizeConfig[size];
  const src = isIcon ? BRAND.logoIcon : BRAND.logoFull;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className="relative" 
        style={{ height: dimensions.height, width: dimensions.width }}
      >
        <Image
          src={src}
          alt={`${BRAND.name} official logo`}
          fill
          priority={priority}
          className="object-contain mix-blend-multiply"
          sizes={`${dimensions.width}px`}
        />
      </div>
      {showText && (
        <span className="mt-2 text-sm font-medium text-gray-500">
          {BRAND.slogan}
        </span>
      )}
    </div>
  );
}
