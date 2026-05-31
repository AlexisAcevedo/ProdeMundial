import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

/**
 * Componente base para renderizar marcadores de posición (placeholders) animados
 * que indican estados de carga (shimmer/pulse animation).
 */
export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-slate-200 dark:bg-white/10';
  
  const variantClasses = 
    variant === 'circular'
      ? 'rounded-full'
      : variant === 'text'
      ? 'rounded-md h-3 w-full'
      : 'rounded-xl';

  const style: React.CSSProperties = {
    width: width !== undefined ? width : undefined,
    height: height !== undefined ? height : undefined,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses} ${className}`}
      style={style}
      data-testid="skeleton-element"
    />
  );
}

/**
 * Esqueleto pre-ensamblado que imita la estructura visual de una MatchCard.
 */
export function MatchCardSkeleton() {
  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200/50 bg-white p-5 dark:border-white/5 dark:bg-fifa-card space-y-5">
      <div className="flex items-center justify-between">
        <Skeleton width="110px" height="16px" />
        <Skeleton width="75px" height="22px" />
      </div>

      <div className="flex items-center justify-between gap-3 py-2">
        <div className="flex flex-1 items-center justify-end gap-2.5">
          <Skeleton width="70px" height="14px" />
          <Skeleton variant="circular" width="28px" height="28px" />
        </div>
        <Skeleton width="16px" height="16px" />
        <div className="flex flex-1 items-center justify-start gap-2.5">
          <Skeleton variant="circular" width="28px" height="28px" />
          <Skeleton width="70px" height="14px" />
        </div>
      </div>

      <div className="flex justify-center gap-6 pt-2">
        <Skeleton width="56px" height="56px" />
        <Skeleton width="56px" height="56px" />
      </div>

      <div className="pt-2">
        <Skeleton height="44px" className="w-full" />
      </div>
    </div>
  );
}

/**
 * Esqueleto pre-ensamblado que imita una fila de la tabla de posiciones de la liga.
 */
export function StandingRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-4 px-6 border-b border-slate-100 dark:border-white/5">
      <div className="flex items-center gap-4 flex-1">
        <Skeleton width="24px" height="24px" className="shrink-0" />
        <Skeleton variant="circular" width="40px" height="40px" className="shrink-0" />
        <div className="space-y-2 flex-1 max-w-[200px]">
          <Skeleton width="80%" height="14px" />
          <Skeleton width="60%" height="10px" />
        </div>
      </div>
      <Skeleton width="48px" height="32px" className="shrink-0" />
    </div>
  );
}
