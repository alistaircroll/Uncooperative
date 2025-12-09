'use client';

import { useEffect, Suspense } from 'react';
import { useGameConnection } from '@/hooks/useGameConnection';
import { usePlayer } from '@/hooks/usePlayer';
import { useGameState } from '@/hooks/useGameState';
import { PlayerJoin } from '@/components/game/PlayerJoin';
import { PlayerLobby } from '@/components/game/PlayerLobby';
import { ActiveGame } from '@/components/game/ActiveGame';
import styles from './play.module.css';

function PlayContent() {
    const { gameId, playerId, connectionStatus } = useGameConnection();
    const { player, loading: playerLoading, joinGame, updateProfile, updateState, leaveGame: removePlayer } = usePlayer(gameId, playerId);
    const { gameState, loading: gameLoading } = useGameState(gameId);

    // Auto-join if not already in game
    useEffect(() => {
        if (gameState && gameState.status === 'waiting' && playerId && !player && !playerLoading) {
            joinGame();
        }
    }, [gameState, playerId, player, playerLoading]);

    const handleLeaveGame = async () => {
        await removePlayer();
        window.location.href = '/about';
    };

    if (connectionStatus === 'connecting' || playerLoading || gameLoading) {
        return <div className={styles.play}>
            <div className="container flex-center" style={{ minHeight: '100vh' }}>
                <div className="pulse">Loading...</div>
            </div>
        </div>;
    }

    if (!gameState) {
        return <div className={styles.play}>
            <div className="container flex-center" style={{ minHeight: '100vh' }}>
                <div className="glass-card text-center">
                    <h2>Game not found</h2>
                    <p className="mt-sm">Please check the game ID</p>
                </div>
            </div>
        </div>;
    }

    // Player removed or not joined yet (and not auto-joined)
    if (!player) {
        // If game is already playing and we aren't in it, show removed/cant join
        if (gameState.status !== 'waiting') {
            return <div className={styles.play}>
                <div className="container flex-center" style={{ minHeight: '100vh' }}>
                    <div className="glass-card text-center">
                        <h2>You have been removed from the game</h2>
                        <button onClick={() => window.location.href = '/'} className="btn btn-primary mt-md">
                            Return Home
                        </button>
                    </div>
                </div>
            </div>;
        }
        return <div className={styles.play}><div className="pulse container flex-center">Joining...</div></div>
    }

    // Registration
    if (!player.name) {
        return <div className={styles.play}>
            <PlayerJoin onJoin={(name) => updateProfile(name)} />
        </div>;
    }

    // Waiting for game to start
    if (gameState.status === 'waiting') {
        return <div className={styles.play}>
            <PlayerLobby playerName={player.name} onLeave={handleLeaveGame} />
        </div>;
    }

    // Gameplay
    if (gameState.status === 'playing') {
        return <div className={styles.play}>
            <ActiveGame
                gameState={gameState}
                player={player}
                onExtract={(amount) => updateState({ currentTurnExtraction: amount })}
                onLeave={handleLeaveGame}
            />
        </div>;
    }

    // Game Over
    return <div className={styles.play}>
        <div className="container flex-center" style={{ minHeight: '100vh' }}>
            <div className="glass-card text-center">
                <h2>Game Over</h2>
                <p className="mt-md">Final Wealth: ${(player.wealth / 1000000).toFixed(1)}M</p>

                <div className="mt-lg">
                    {gameState.status === 'waiting' ? (
                        <div className="pulse" style={{ color: 'var(--success)' }}>
                            New game started!
                        </div>
                    ) : (
                        <div style={{ color: 'var(--text-secondary)' }}>
                            Waiting for host to start new game...
                        </div>
                    )}
                </div>

                <button onClick={() => window.location.href = '/'} className="btn btn-secondary mt-lg">
                    Leave Game
                </button>
            </div>
        </div>
    </div>;
}

export default function PlayPage() {
    return (
        <Suspense fallback={<div className="container flex-center" style={{ minHeight: '100vh' }}>Loading...</div>}>
            <PlayContent />
        </Suspense>
    );
}
