import React from 'react';

export const Isotype = ({ className = "w-12 h-8", colorMode = "light" }: { className?: string, colorMode?: "light" | "dark" }) => {
  const tinta = "#16181D";
  const brasa = "#FF5A36";
  const hueso = "#F2EEE6";
  
  const baseColor = colorMode === "dark" ? hueso : tinta;

  return (
    <svg viewBox="0 0 100 62" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* La Masa (Consenso/Precio) */}
      <path 
        d="M0 60 L100 60 L100 30 Z" 
        fill={baseColor} 
      />
      {/* La Astilla (Edge/Probabilidad) */}
      <path 
        d="M0 56 L100 22 L100 6 Z" 
        fill={brasa} 
      />
    </svg>
  );
};

export const Logo = ({ className = "h-8", colorMode = "light", showText = true }: { className?: string, colorMode?: "light" | "dark", showText?: boolean }) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Isotype className="h-[85%] w-auto mb-[0.1em]" colorMode={colorMode} />
      {showText && (
        <span className={`font-display font-extrabold text-2xl tracking-tighter leading-none ${colorMode === 'dark' ? 'text-brand-hueso' : 'text-brand-tinta'}`}>
          Edgio
        </span>
      )}
    </div>
  );
};

export const WedgeTool = ({ price, probability, edge, colorMode = "light" }: { price: number, probability: number, edge: number, colorMode?: "light" | "dark" }) => {
  return (
    <div className="flex items-center gap-6 py-4">
      <div className="text-center">
        <span className="text-[10px] uppercase font-bold tracking-widest text-text-tertiary block mb-1">Precio</span>
        <span className="font-mono text-3xl font-bold">{price.toFixed(2)}</span>
      </div>
      
      <div className="flex-grow flex justify-center">
        <Isotype className="h-12 w-auto" colorMode={colorMode} />
      </div>
      
      <div className="text-center">
        <span className="text-[10px] uppercase font-bold tracking-widest text-text-tertiary block mb-1">Probabilidad</span>
        <span className="font-mono text-3xl font-bold">{probability.toFixed(2)}</span>
      </div>
      
      <div className="ml-4 pl-4 border-l border-border-subtle">
        <span className="text-[10px] uppercase font-bold tracking-widest text-text-tertiary block mb-1">Edge</span>
        <span className="font-mono text-xl font-bold text-brand-brasa">+{edge} pts</span>
      </div>
    </div>
  );
};
