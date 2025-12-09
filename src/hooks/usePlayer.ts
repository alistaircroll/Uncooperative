import { useState, useEffect } from 'react';
import { ref, update, remove, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';

export interface PlayerData {
    id: string;
    name: string | null;
    wealth: number;
    currentTurnExtraction?: number | null;
    joinedAt: number;
}

export function usePlayer(gameId: string | null, playerId: string | null) {
    const [player, setPlayer] = useState<PlayerData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!gameId || !playerId) {
            setLoading(false);
            return;
        }

        const playerRef = ref(database, `games/${gameId}/players/${playerId}`);
        const unsubscribe = onValue(playerRef, (snapshot) => {
            const data = snapshot.val();
            setPlayer(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [gameId, playerId]);

    const joinGame = async () => {
        if (!gameId || !playerId) return;

        const playerRef = ref(database, `games/${gameId}/players/${playerId}`);
        await update(playerRef, {
            id: playerId,
            name: null,
            wealth: 0,
            currentTurnExtraction: null,
            joinedAt: Date.now()
        });
    };

    const updateProfile = async (name: string) => {
        if (!gameId || !playerId) return;
        const playerRef = ref(database, `games/${gameId}/players/${playerId}`);
        await update(playerRef, {
            name: name.trim()
        });
    };

    const updateState = async (updates: Partial<PlayerData>) => {
        if (!gameId || !playerId) return;
        const playerRef = ref(database, `games/${gameId}/players/${playerId}`);
        await update(playerRef, updates);
    };

    const leaveGame = async () => {
        if (!gameId || !playerId) return;
        const playerRef = ref(database, `games/${gameId}/players/${playerId}`);
        await remove(playerRef);
    };

    return {
        player,
        loading,
        joinGame,
        updateProfile,
        updateState,
        leaveGame
    };
}
