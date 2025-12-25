
import React, { useState } from 'react';
import { CharacterType } from '../types';
import { CHARACTER_STYLES } from '../constants';

interface MenuProps {
  onSelectCharacter: (char: CharacterType, styleIndex: number) => void;
}

const Menu: React.FC<MenuProps> = ({ onSelectCharacter }) => {
  const [step, setStep] = useState<'CHAR' | 'STYLE'>('CHAR');
  const [selectedChar, setSelectedChar] = useState<CharacterType>(CharacterType.PANDA);
  const [selectedStyleIndex, setSelectedStyleIndex] = useState<number>(0);

  const handleCharClick = (char: CharacterType) => {
    setSelectedChar(char);
    setStep('STYLE');
    setSelectedStyleIndex(0); // Reset to default style
  };

  const handleBack = () => {
    setStep('CHAR');
  };

  const handlePlay = () => {
    onSelectCharacter(selectedChar, selectedStyleIndex);
  };

  // Helper to render the SVG preview with dynamic colors
  const renderPreview = (char: CharacterType, styleIdx: number) => {
    const styles = CHARACTER_STYLES[char === CharacterType.PANDA ? 'PANDA' : 'BEAR'];
    const s = styles[styleIdx];
    
    // Determine colors
    const cPrimary = s.primary;
    const cSecondary = s.secondary;
    const cAccent = s.accent;

    if (char === CharacterType.PANDA) {
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
          <g stroke="black" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
            {/* Gi Body */}
            <path d="M 60 160 L 140 160 L 130 190 L 70 190 Z" fill={cPrimary} />
            <path d="M 60 160 L 100 200 L 140 160" fill="none" strokeWidth="5" />
            {/* Head */}
            <circle cx="50" cy="60" r="22" fill={cSecondary} />
            <circle cx="150" cy="60" r="22" fill={cSecondary} />
            <path d="M 50 100 C 50 60, 150 60, 150 100 C 160 110, 160 130, 140 140 C 120 155, 80 155, 60 140 C 40 130, 40 110, 50 100" fill={cPrimary} />
            {/* Eyes */}
            <path d="M 60 95 Q 80 115 90 95" fill={cSecondary} />
            <path d="M 140 95 Q 120 115 110 95" fill={cSecondary} />
            <circle cx="75" cy="102" r="4" fill="white" stroke="none" />
            <circle cx="125" cy="102" r="4" fill="white" stroke="none" />
            {/* Headband */}
            <path d="M 30 75 Q 100 65 170 75 L 170 90 Q 100 80 30 90 Z" fill={cAccent} />
            <path d="M 170 82 Q 200 70 230 60 L 240 80 Q 200 90 170 95" fill={cAccent} />
            {/* Nose */}
            <path d="M 95 125 Q 100 130 105 125" fill={cSecondary} />
            <path d="M 95 135 Q 100 140 105 135" fill="none" strokeWidth="3" />
            {/* Fist */}
            <circle cx="160" cy="150" r="20" fill={cPrimary} />
          </g>
        </svg>
      );
    } else {
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
          <g stroke="black" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
            {/* Armor Body */}
            <path d="M 50 160 L 150 160 L 160 200 L 40 200 Z" fill="#333" />
            <rect x="70" y="170" width="60" height="30" fill="#555" />
            {/* Spiked Shoulder */}
            <path d="M 140 150 L 180 130 L 170 170 Z" fill="#777" />
            <path d="M 160 135 L 170 110 L 175 135 Z" fill="#ddd" />
            {/* Ears */}
            <circle cx="40" cy="60" r="18" fill={cPrimary} />
            <path d="M 140 45 L 180 45 L 160 75 Z" fill="#555" />
            {/* Head */}
            <path d="M 100 40 C 150 40, 160 80, 160 110 C 160 150, 140 160, 100 160 C 60 160, 40 150, 40 110 C 40 80, 50 40, 100 40" fill={cPrimary} />
            {/* Metal Jaw */}
            <path d="M 60 120 L 140 120 L 130 155 L 70 155 Z" fill="#999" />
            {/* Eyes */}
            <circle cx="70" cy="90" r="5" fill="#111" />
            {/* Cyber Eye */}
            <circle cx="130" cy="90" r="12" fill="#333" />
            <circle cx="130" cy="90" r="5" fill={cAccent} stroke="none" className="animate-pulse" />
            {/* Scars */}
            <path d="M 60 70 L 80 80" stroke={cAccent} strokeWidth="2" />
          </g>
        </svg>
      );
    }
  };

  if (step === 'CHAR') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white z-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black opacity-80"></div>
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        
        <h1 className="relative z-10 text-7xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 italic tracking-tighter drop-shadow-2xl" style={{ filter: 'drop-shadow(4px 4px 0px #000)' }}>
          ROCKET RUMBLE
        </h1>
        <div className="relative z-10 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 mb-10"></div>
        
        <p className="relative z-10 text-xl mb-8 text-blue-300 font-bold tracking-[0.5em] uppercase drop-shadow-md">Choose Your Fighter</p>
        
        <div className="relative z-10 flex gap-16">
          {/* PANDA BUTTON */}
          <button
            onClick={() => handleCharClick(CharacterType.PANDA)}
            className="group relative w-72 h-[400px] bg-white rounded-xl overflow-hidden hover:-translate-y-4 hover:shadow-[0_0_50px_rgba(59,130,246,0.6)] transition-all duration-300 border-4 border-black ring-4 ring-blue-900"
          >
            <div className="absolute inset-0 bg-blue-600 flex flex-col items-center justify-center">
              <div className="scale-125 transition-transform group-hover:scale-150 duration-500">
                {renderPreview(CharacterType.PANDA, 0)}
              </div>
              <div className="absolute bottom-0 w-full bg-black/80 py-4">
                 <h2 className="text-3xl font-black text-white italic">PANDA</h2>
              </div>
            </div>
          </button>

          {/* BEAR BUTTON */}
          <button
            onClick={() => handleCharClick(CharacterType.BEAR)}
            className="group relative w-72 h-[400px] bg-neutral-800 rounded-xl overflow-hidden hover:-translate-y-4 hover:shadow-[0_0_50px_rgba(220,38,38,0.6)] transition-all duration-300 border-4 border-black ring-4 ring-red-900"
          >
            <div className="absolute inset-0 bg-red-900 flex flex-col items-center justify-center">
              <div className="scale-125 transition-transform group-hover:scale-150 duration-500">
                {renderPreview(CharacterType.BEAR, 0)}
              </div>
              <div className="absolute bottom-0 w-full bg-black/80 py-4">
                 <h2 className="text-3xl font-black text-white italic">BEAR</h2>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // STYLE SELECTION STEP
  const charStyles = CHARACTER_STYLES[selectedChar === CharacterType.PANDA ? 'PANDA' : 'BEAR'];
  const currentStyle = charStyles[selectedStyleIndex];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white z-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-gray-900"></div>
      
      {/* Back Button */}
      <button onClick={handleBack} className="absolute top-6 left-6 text-gray-400 hover:text-white flex items-center gap-2 z-20 font-bold uppercase tracking-widest">
        <span>← Change Character</span>
      </button>

      <div className="relative z-10 flex w-full max-w-5xl px-12 gap-12 items-center">
        
        {/* Left: Big Preview */}
        <div className="w-1/2 flex flex-col items-center">
            <h2 className="text-5xl font-black italic mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400" style={{ textShadow: '4px 4px 0 #000' }}>
               {selectedChar}
            </h2>
            <div className="text-2xl font-bold text-blue-400 tracking-widest uppercase mb-8">{currentStyle.name}</div>
            
            <div className="relative w-80 h-80">
               <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl animate-pulse"></div>
               {renderPreview(selectedChar, selectedStyleIndex)}
            </div>
        </div>

        {/* Right: Style Grid & Play */}
        <div className="w-1/2 flex flex-col items-center">
            <h3 className="text-xl font-bold text-gray-400 tracking-[0.3em] mb-6">SELECT STYLE</h3>
            
            <div className="grid grid-cols-5 gap-4 mb-10">
              {charStyles.map((style, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedStyleIndex(idx)}
                  className={`w-16 h-16 rounded-full border-4 shadow-lg transition-transform hover:scale-110 relative overflow-hidden group ${selectedStyleIndex === idx ? 'border-white scale-110 ring-4 ring-blue-500' : 'border-black opacity-70 hover:opacity-100'}`}
                  style={{ background: style.primary }}
                  title={style.name}
                >
                  <div className="absolute inset-0 flex">
                     <div className="w-1/2 h-full" style={{ background: style.primary }}></div>
                     <div className="w-1/2 h-full" style={{ background: style.secondary }}></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-4 h-4 rounded-full border border-black shadow-sm" style={{ background: style.accent }}></div>
                  </div>
                  {selectedStyleIndex === idx && (
                    <div className="absolute inset-0 ring-2 ring-white rounded-full"></div>
                  )}
                </button>
              ))}
            </div>

            {/* BIG PLAY BUTTON */}
            <button
              onClick={handlePlay}
              className="w-full py-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-black text-4xl italic text-white shadow-[0_10px_0_#14532d] hover:translate-y-1 hover:shadow-[0_5px_0_#14532d] active:translate-y-3 active:shadow-none transition-all border-4 border-green-900 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12"></div>
              <span className="relative drop-shadow-md">FIGHT!</span>
            </button>
        </div>

      </div>
    </div>
  );
};

export default Menu;
