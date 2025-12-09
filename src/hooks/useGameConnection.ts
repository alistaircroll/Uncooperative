import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export interface GameConnection {
  gameId: string | null;
  playerId: string | null;
  connectionStatus: 'connecting' | 'connected' | 'error';
}

export function useGameConnection(): GameConnection {
  const searchParams = useSearchParams();
  const gameId = searchParams.get('id');
  const playerIdFromUrl = searchParams.get('playerId');
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && gameId) {
      if (playerIdFromUrl) {
        setPlayerId(playerIdFromUrl);
      } else {
        const newPlayerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newUrl = `${window.location.pathname}?id=${gameId}&playerId=${newPlayerId}`;
        window.history.replaceState({}, '', newUrl);
        setPlayerId(newPlayerId);
      }
    }
  }, [gameId, playerIdFromUrl]);

  return {
    gameId,
    playerId,
    connectionStatus: gameId && playerId ? 'connected' : 'connecting'
  };
}
