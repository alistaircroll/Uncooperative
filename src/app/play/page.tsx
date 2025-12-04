'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ref, onValue, update, push, remove } from 'firebase/database';
import { database } from '@/lib/firebase';
import styles from './play.module.css';

interface GameState {
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

function PlayContent() {
    const searchParams = useSearchParams();
    const gameId = searchParams.get('id');
    const playerIdFromUrl = searchParams.get('playerId');

    const [gameState, setGameState] = useState<GameState | null>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [playerName, setPlayerName] = useState('');
    const [extraction, setExtraction] = useState('0');
    const [loading, setLoading] = useState(true);

    // Get or create player ID from URL parameter
    useEffect(() => {
        if (typeof window !== 'undefined' && gameId) {
            if (playerIdFromUrl) {
                // Player ID already in URL
                setPlayerId(playerIdFromUrl);
            } else {
                // Generate new player ID and add to URL
                const newPlayerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const newUrl = `${window.location.pathname}?id=${gameId}&playerId=${newPlayerId}`;
                window.history.replaceState({}, '', newUrl);
                setPlayerId(newPlayerId);
            }
        }
    }, [gameId, playerIdFromUrl]);

    // Listen to game state
    useEffect(() => {
        if (!gameId || !playerId) return;

        const gameRef = ref(database, `games/${gameId}`);
        const unsubscribe = onValue(gameRef, (snapshot) => {
            const data = snapshot.val();
            setGameState(data);
            setLoading(false);

            // Auto-join if not already in game
            if (data && data.status === 'waiting' && !data.players?.[playerId]) {
                joinGame();
            }
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

    const submitName = async () => {
        if (!playerId) return;
        if (!playerName.trim()) return;

        const playerRef = ref(database, `games/${gameId}/players/${playerId}`);
        await update(playerRef, {
            name: playerName.trim()
        });
    };

    const submitExtraction = async () => {
        if (!playerId) return;
        const amount = parseFloat(extraction) * 1000000; // Convert to actual value
        if (isNaN(amount) || amount < 0) return;

        if (!gameState) return;
        const maxExtraction = gameState.maxExtraction;
        const finalAmount = Math.min(amount, maxExtraction);

        const playerRef = ref(database, `games/${gameId}/players/${playerId}`);
        await update(playerRef, {
            currentTurnExtraction: finalAmount
        });

        setExtraction('');
    };

    const leaveGame = async () => {
        if (!playerId) return;
        const playerRef = ref(database, `games/${gameId}/players/${playerId}`);
        await remove(playerRef); // Remove player
        window.location.href = '/about';
    };

    if (loading) {
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

    const player = playerId ? gameState.players?.[playerId] : null;

    // Player removed
    if (!player) {
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

    // Registration
    if (!player.name) {
        return <div className={styles.play}>
            <div className="container flex-center" style={{ minHeight: '100vh' }}>
                <div className="glass-card" style={{ maxWidth: '400px', width: '100%' }}>
                    <h2 className="text-center mb-md">Sign In</h2>
                    <p className="text-center mb-md">Enter your name to join the game</p>

                    <input
                        type="text"
                        placeholder="Your Name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && submitName()}
                        autoFocus
                    />

                    <button
                        onClick={submitName}
                        disabled={!playerName.trim()}
                        className="btn btn-primary mt-md"
                        style={{ width: '100%' }}
                    >
                        Sign In
                    </button>
                </div>
            </div>
        </div>;
    }

    // Waiting for game to start
    if (gameState.status === 'waiting') {
        return <div className={styles.play}>
            <div className="container flex-center" style={{ minHeight: '100vh' }}>
                <div className="glass-card text-center">
                    <h2>Welcome, {player.name}!</h2>
                    <p className="mt-md pulse">Waiting for game to start...</p>

                    <button onClick={leaveGame} className="btn btn-secondary mt-lg">
                        Leave Game
                    </button>
                </div>
            </div>
        </div>;
    }

    // Gameplay
    if (gameState.status === 'playing') {
        const hasSubmitted = player.currentTurnExtraction !== undefined && player.currentTurnExtraction !== null;
        const maxExtraction = gameState.maxExtraction / 1000000; // In millions
        const currentAmount = extraction === '' ? 0 : parseFloat(extraction);

        const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setExtraction(e.target.value);
        };

        const adjustExtraction = (delta: number) => {
            const newAmount = Math.min(Math.max(0, currentAmount + delta), maxExtraction);
            setExtraction(newAmount.toFixed(1));
        };

        return <div className={styles.play}>
            <div className="container" style={{ paddingTop: 'var(--space-xl)' }}>
                <div className="glass-card">
                    <div className="text-center mb-md">
                        <h2 className="mb-xs">Turn {gameState.turn}</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>{player.name}</p>
                    </div>

                    <div className={styles.stats}>
                        <div className={styles.stat}>
                            <div className={styles.statLabel}>Your Wealth</div>
                            <div className={styles.statValue}>${(player.wealth / 1000000).toFixed(1)}M</div>
                        </div>
                        <div className={styles.stat}>
                            <div className={styles.statLabel}>Treasury</div>
                            <div className={styles.statValue}>${(gameState.treasury / 1000000).toFixed(1)}M</div>
                        </div>
                    </div>

                    {!hasSubmitted ? (
                        <>
                            <div className={styles.extractionControl}>
                                <div className={styles.amountDisplay}>
                                    ${currentAmount.toFixed(1)}M
                                </div>

                                <div className={styles.sliderWrapper}>
                                    <button
                                        className={styles.adjustBtn}
                                        onClick={() => adjustExtraction(-0.1)}
                                    >
                                        -
                                    </button>

                                    <div className={styles.sliderContainer}>
                                        <input
                                            type="range"
                                            min="0"
                                            max={gameState.maxExtraction / 1000000}
                                            step="0.1"
                                            value={extraction}
                                            onChange={handleSliderChange}
                                            className={styles.slider}
                                        />
                                    </div>

                                    <button
                                        className={styles.adjustBtn}
                                        onClick={() => adjustExtraction(0.1)}
                                    >
                                        +
                                    </button>
                                </div>

                                <div className={styles.errorMsg}>
                                    {currentAmount >= maxExtraction ? `Maximum extraction is $${maxExtraction}M` : ''}
                                </div>
                            </div>

                            <button
                                onClick={submitExtraction}
                                className="btn btn-primary mt-md"
                                style={{ width: '100%' }}
                            >
                                Extract
                            </button>
                        </>
                    ) : (
                        <div className="text-center mt-lg">
                            <div className={styles.waiting}>
                                <div className="pulse">Waiting for other players...</div>
                                <p className="mt-sm" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    You extracted ${(player.currentTurnExtraction / 1000000).toFixed(1)}M
                                </p>
                            </div>
                        </div>
                    )}

                    <button onClick={leaveGame} className="btn btn-secondary mt-lg" style={{ width: '100%' }}>
                        Leave Game
                    </button>
                </div>
            </div>
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
