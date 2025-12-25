
import React, { useState } from 'react';
import Menu from './components/Menu';
import Cutscene from './components/Cutscene';
import Game from './components/Game';
import { GameState, CharacterType } from './types';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [selectedChar, setSelectedChar] = useState<CharacterType>(CharacterType.PANDA);
  const [styleIndex, setStyleIndex] = useState<number>(0);

  const handleSelectCharacter = (char: CharacterType, styleIdx: number) => {
    setSelectedChar(char);
    setStyleIndex(styleIdx);
    setGameState(GameState.CUTSCENE);
  };

  const handleCutsceneComplete = () => {
    setGameState(GameState.GAMEPLAY);
  };

  const handleGameOver = () => {
    setGameState(GameState.MENU);
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center font-sans">
      <div className="w-[800px] h-[600px] relative shadow-2xl overflow-hidden bg-black">
        {gameState === GameState.MENU && (
          <Menu onSelectCharacter={handleSelectCharacter} />
        )}
        
        {gameState === GameState.CUTSCENE && (
          <Cutscene onComplete={handleCutsceneComplete} />
        )}
        
        {gameState === GameState.GAMEPLAY && (
          <Game playerChar={selectedChar} playerStyleIndex={styleIndex} onGameOver={handleGameOver} />
        )}
      </div>
    </div>
  );
};

export default App;
