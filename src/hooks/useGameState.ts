import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';

export interface GameState {
    status: string;
    players: Record<string, any>;
    treasury: number;
    maxExtraction: number;
    interestRate: number;
    maxTurns: number;
    turn: number;
    turnPhase?: string;
    lastTurnExtraction?: number;
    lastTurnInterest?: number;
    projectedTreasury?: number;
    showWealth?: boolean;
    [key: string]: any;
}

export function useGameState(gameId: string | null) {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!gameId) {
            setLoading(false);
            return;
        }

        const gameRef = ref(database, `games/${gameId}`);
        const unsubscribe = onValue(gameRef, (snapshot) => {
            const data = snapshot.val();
            setGameState(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [gameId]);

    return {
        gameState,
        loading
    };
}
