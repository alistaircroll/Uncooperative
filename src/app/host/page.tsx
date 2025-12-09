'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ref, onValue, update, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import QRCode from 'react-qr-code';
import styles from './host.module.css';

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

function HostContent() {
    const searchParams = useSearchParams();
    const gameId = searchParams.get('id');

    const [gameState, setGameState] = useState<GameState | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!gameId) return;

        const gameRef = ref(database, `games/${gameId}`);
        const unsubscribe = onValue(gameRef, (snapshot) => {
            const data = snapshot.val();
            setGameState(data);
            setLoading(false);

            // Auto-progress game logic
            if (data && data.status === 'playing') {
                checkTurnProgress(data);
            }
        });

        return () => unsubscribe();
    }, [gameId]);

    const checkTurnProgress = async (state: GameState) => {
        const players = state.players || {};
        const playerList = Object.values(players);

        // Check if all players have submitted
        const allSubmitted = playerList.every(p => p.currentTurnExtraction !== undefined && p.currentTurnExtraction !== null);

        if (allSubmitted && state.turnPhase === 'extracting') {
            // Calculate total extraction to check for bankruptcy
            const totalExtraction = playerList.reduce((sum, p) => sum + (p.currentTurnExtraction || 0), 0);
            const newTreasury = state.treasury - totalExtraction;

            if (newTreasury <= 0) {
                // Bankrupt! Skip summary and end game immediately
                processTurn(state);
            } else {
                // Show summary screen
                setTimeout(() => showTurnSummary(state), 500);
            }
        }

        // Auto-advance from summary after 5 seconds
        if (state.turnPhase === 'summary') {
            setTimeout(() => processTurn(state), 5000);
        }
    };

    const showTurnSummary = async (state: GameState) => {
        const players = state.players || {};
        const playerList = Object.values(players);
        const activePlayers = playerList.filter((p: any) => p.name);
        const totalExtraction = activePlayers.reduce((sum: number, p: any) => sum + (parseInt(p.currentTurnExtraction) || 0), 0);
        const newTreasury = state.treasury - totalExtraction;
        const interest = newTreasury * state.interestRate;

        await update(ref(database, `games/${gameId}`), {
            turnPhase: 'summary',
            lastTurnExtraction: totalExtraction,
            lastTurnInterest: interest,
            projectedTreasury: newTreasury + interest // Save projected treasury including interest
        });
    };

    const processTurn = async (state: GameState) => {
        const players = state.players || {};
        const playerList = Object.values(players);

        // Calculate total extraction
        const totalExtraction = playerList.reduce((sum: number, p: any) => sum + (p.currentTurnExtraction || 0), 0);
        const newTreasury = state.treasury - totalExtraction;

        // Update player wealth
        const updatedPlayers: Record<string, any> = {};
        Object.keys(players).forEach(pid => {
            updatedPlayers[`players/${pid}/wealth`] = players[pid].wealth + players[pid].currentTurnExtraction;
            updatedPlayers[`players/${pid}/currentTurnExtraction`] = null;
        });

        // Check for bankruptcy
        if (newTreasury <= 0) {
            await update(ref(database, `games/${gameId}`), {
                ...updatedPlayers,
                treasury: Math.max(0, newTreasury),
                status: 'lost',
                turnPhase: 'ended'
            });
            return;
        }

        // Apply interest
        const interest = newTreasury * state.interestRate;
        const finalTreasury = newTreasury + interest;
        const nextTurn = state.turn + 1;

        // Check if game is over
        if (nextTurn >= state.maxTurns) {
            await update(ref(database, `games/${gameId}`), {
                ...updatedPlayers,
                treasury: finalTreasury,
                turn: nextTurn,
                status: 'won',
                turnPhase: 'ended'
            });
        } else {
            await update(ref(database, `games/${gameId}`), {
                ...updatedPlayers,
                treasury: finalTreasury,
                turn: nextTurn,
                turnPhase: 'extracting'
            });
        }
    };

    const startGame = async () => {
        // Remove unnamed players before starting
        const updates: Record<string, any> = {};
        playerList.forEach(p => {
            if (!p.name) {
                updates[`players/${p.id}`] = null;
            }
        });

        // Set game status to playing
        updates['status'] = 'playing';
        updates['turn'] = 1;
        updates['turnPhase'] = 'extracting';
        // Note: maxTurns is NOT set here - we preserve the user's setting from gameState

        await update(ref(database, `games/${gameId}`), updates);
    };

    const endGame = async () => {
        await update(ref(database, `games/${gameId}`), {
            status: 'waiting',
            turn: 0,
            treasury: 100000000,
            turnPhase: null
        });
    };

    const clearPlayers = async () => {
        await update(ref(database, `games/${gameId}`), {
            players: {}
        });
    };

    const playerCount = Object.keys(gameState?.players || {}).length;

    const optimalWealth = useMemo(() => {
        if (!gameState || playerCount < 3) return null;

        const startingTreasury = gameState.treasury / 1000000;
        const interestRate = gameState.interestRate;
        const maxExtraction = gameState.maxExtraction / 1000000;
        const turns = gameState.maxTurns;

        let bestTotalExtracted = 0;

        // Search for optimal extraction per player
        // Step by 0.1M for performance
        for (let testExtraction = 0; testExtraction <= maxExtraction; testExtraction += 0.1) {
            let treasury = startingTreasury;
            let totalExtracted = 0;
            const totalExtractionPerTurn = testExtraction * playerCount;

            for (let turn = 1; turn <= turns; turn++) {
                if (treasury <= 0) break;

                const actualExtraction = Math.min(totalExtractionPerTurn, Math.max(0, treasury));
                treasury -= actualExtraction;
                totalExtracted += actualExtraction;
                treasury += treasury * interestRate;
            }

            if (totalExtracted > bestTotalExtracted) {
                bestTotalExtracted = totalExtracted;
            }
        }

        return bestTotalExtracted;
    }, [gameState?.treasury, gameState?.interestRate, gameState?.maxExtraction, gameState?.maxTurns, playerCount]);

    if (loading) {
        return <div className="container flex-center" style={{ minHeight: '100vh' }}>
            <div className="pulse">Loading game...</div>
        </div>;
    }

    if (!gameState) {
        return <div className="container flex-center" style={{ minHeight: '100vh' }}>
            <div className="glass-card text-center">
                <h2>Game not found</h2>
                <p className="mt-sm">Please check the game ID</p>
            </div>
        </div>;
    }

    const players = gameState.players || {};
    const playerList = Object.entries(players).map(([id, data]) => ({ id, ...data }));
    const namedPlayerCount = playerList.filter(p => p.name).length;
    const canStart = namedPlayerCount >= 3;

    const joinUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/play?id=${gameId}`
        : '';

    // Waiting Screen
    if (gameState.status === 'waiting') {
        return (
            <div className={styles.host}>
                <div className="container">
                    <h1 className="text-center fade-in">UNCOOPERATIVE</h1>

                    <div className={`${styles.hostLayout} mt-lg`}>
                        {/* Left Column: Join & Players */}
                        <div className={`${styles.hostColumnLeft} fade-in`}>
                            <div className="glass-card">
                                <h3 className="mb-sm text-center">Scan to Join</h3>
                                <div className={styles.qrContainer}>
                                    {playerCount >= 5 ? (
                                        <div className={styles.qrDisabled}>Maximum players joined</div>
                                    ) : (
                                        <QRCode value={joinUrl} size={200} />
                                    )}
                                </div>
                                <p className="text-center mt-sm" style={{ fontSize: '0.9rem' }}>{joinUrl}</p>
                            </div>

                            <div className="glass-card">
                                <h3 className="mb-sm">Players ({playerCount})</h3>
                                {playerCount === 0 ? (
                                    <p className="text-center" style={{ color: 'var(--text-muted)' }}>Waiting for players to join...</p>
                                ) : (
                                    <div className={styles.playerList}>
                                        {playerList.map(player => (
                                            <div key={player.id} className={styles.playerCard}>
                                                <div className={styles.playerName}>
                                                    {player.name || <span className="pulse">signing in...</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={clearPlayers}
                                className="btn btn-secondary"
                                style={{ width: '100%' }}
                            >
                                Clear Players
                            </button>
                        </div>

                        {/* Right Column: About & Settings & Start */}
                        <div className={`${styles.hostColumnRight} fade-in`}>
                            {/* About Section */}
                            <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                                <h3 className="mb-sm">About this game</h3>
                                <p style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                                    Cooperating is hard. When a bunch of people share a finite resource, but act selfishly, everyone is eventually worse off. On the other hand, the cheater does better than everyone else—so everyone cheats.
                                </p>
                                <p style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                                    This is known as the <a href="https://en.wikipedia.org/wiki/Tragedy_of_the_commons" target="_blank" rel="noopener noreferrer" style={{ color: '#c084fc', textDecoration: 'underline' }}>tragedy of the commons</a>, and it's a classic example of a coordination problem. Coordination problems are a big part of why wars, famines, greed, and unfairness happen.
                                </p>
                                <p style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                                    Uncooperative is a multi-player tragedy of the commons simulation. To learn how to play and find out more about coordination, game theory, and optimization, click here.
                                </p>
                                <a
                                    href="/about"
                                    target="_blank"
                                    className="btn btn-secondary"
                                    style={{ width: '100%', textAlign: 'center', display: 'block', textDecoration: 'none' }}
                                >
                                    Learn More
                                </a>
                            </div>

                            <div className="glass-card">
                                <h3 className="mb-sm">Game Settings</h3>
                                <div className={styles.settings}>
                                    <div>
                                        <label>Number of Turns</label>
                                        <div className={styles.paramControl}>
                                            <button
                                                className={styles.paramBtn}
                                                onClick={() => update(ref(database, `games/${gameId}`), { maxTurns: Math.max(1, (gameState.maxTurns || 10) - 1) })}
                                            >−</button>
                                            <span className={styles.paramValue}>{gameState.maxTurns || 10}</span>
                                            <button
                                                className={styles.paramBtn}
                                                onClick={() => update(ref(database, `games/${gameId}`), { maxTurns: (gameState.maxTurns || 10) + 1 })}
                                            >+</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label>Starting Treasury</label>
                                        <div className={styles.paramControl}>
                                            <button
                                                className={styles.paramBtn}
                                                onClick={() => update(ref(database, `games/${gameId}`), { treasury: Math.max(1000000, gameState.treasury - 10000000) })}
                                            >−</button>
                                            <span className={styles.paramValue}>${Math.round(gameState.treasury / 1000000)}M</span>
                                            <button
                                                className={styles.paramBtn}
                                                onClick={() => update(ref(database, `games/${gameId}`), { treasury: gameState.treasury + 10000000 })}
                                            >+</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label>Max Extraction</label>
                                        <div className={styles.paramControl}>
                                            <button
                                                className={styles.paramBtn}
                                                onClick={() => update(ref(database, `games/${gameId}`), { maxExtraction: Math.max(1000000, gameState.maxExtraction - 1000000) })}
                                            >−</button>
                                            <span className={styles.paramValue}>${Math.round(gameState.maxExtraction / 1000000)}M</span>
                                            <button
                                                className={styles.paramBtn}
                                                onClick={() => update(ref(database, `games/${gameId}`), { maxExtraction: gameState.maxExtraction + 1000000 })}
                                            >+</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label>Interest Rate</label>
                                        <div className={styles.paramControl}>
                                            <button
                                                className={styles.paramBtn}
                                                onClick={() => update(ref(database, `games/${gameId}`), { interestRate: Math.max(0, gameState.interestRate - 0.01) })}
                                            >−</button>
                                            <span className={styles.paramValue}>{Math.round(gameState.interestRate * 100)}%</span>
                                            <button
                                                className={styles.paramBtn}
                                                onClick={() => update(ref(database, `games/${gameId}`), { interestRate: Math.min(1, gameState.interestRate + 0.01) })}
                                            >+</button>
                                        </div>
                                    </div>

                                    <div style={{ margin: '1rem 0', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                        {optimalWealth !== null ? (
                                            <>
                                                With these settings the maximum that can be extracted is <strong style={{ color: 'var(--accent)' }}>${optimalWealth.toFixed(1)}M</strong> or <strong style={{ color: 'var(--accent)' }}>${(optimalWealth / playerCount).toFixed(1)}M</strong> per player.
                                            </>
                                        ) : (
                                            <>
                                                Once 3 or more players have joined, the maximum extraction amount will appear here.
                                            </>
                                        )}
                                    </div>

                                    <div>
                                        <label>Show Player Wealth</label>
                                        <label className={styles.toggle}>
                                            <input
                                                type="checkbox"
                                                checked={gameState.showWealth || false}
                                                onChange={async (e) => {
                                                    await update(ref(database, `games/${gameId}`), {
                                                        showWealth: e.target.checked
                                                    });
                                                }}
                                            />
                                            <span className={styles.slider}></span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={startGame}
                                disabled={!canStart}
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '1.5rem', fontSize: '1.2rem' }}
                            >
                                Start Game
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Turn Summary Screen
    if (gameState.turnPhase === 'summary') {
        return (
            <div className={styles.host}>
                <div className="container">
                    <h1 className="text-center">Turn {gameState.turn} Summary</h1>

                    <div className="glass-card mt-lg fade-in">
                        <div className={styles.turnSummary}>
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>Total Extracted</span>
                                <span className={styles.summaryValue} style={{ color: 'var(--danger)' }}>
                                    -${((gameState.lastTurnExtraction || 0) / 1000000).toFixed(1)}M
                                </span>
                            </div>

                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>Interest Earned</span>
                                <span className={styles.summaryValue} style={{ color: 'var(--success)' }}>
                                    +${((gameState.lastTurnInterest || 0) / 1000000).toFixed(1)}M
                                </span>
                            </div>

                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>New Treasury Balance</span>
                                <span className={styles.summaryValue}>
                                    ${((gameState.projectedTreasury || 0) / 1000000).toFixed(1)}M
                                </span>
                            </div>

                            <div className={styles.progressContainer}>
                                <div className={styles.progressBar}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Playing Screen
    if (gameState.status === 'playing') {
        return (
            <div className={styles.host}>
                <div className="container">
                    <h1 className="text-center">UNCOOPERATIVE</h1>

                    <div className={styles.gameStats}>
                        <div className="glass-card">
                            <div className={styles.statLabel}>Treasury</div>
                            <div className={styles.statValue}>${(gameState.treasury / 1000000).toFixed(1)}M</div>
                        </div>
                        <div className="glass-card">
                            <div className={styles.statLabel}>Turn</div>
                            <div className={styles.statValue}>{gameState.turn} / {gameState.maxTurns}</div>
                        </div>
                        <div className="glass-card">
                            <div className={styles.statLabel}>Interest</div>
                            <div className={styles.statValue}>{(gameState.interestRate * 100)}%</div>
                        </div>
                    </div>

                    <div className="glass-card mt-lg text-center">
                        <h3 className="pulse">Everyone select how much to extract from the treasury</h3>
                    </div>

                    <div className="glass-card mt-lg">
                        <h3 className="mb-sm">Players</h3>
                        <div className={styles.playerList}>
                            {playerList.map(player => {
                                const hasSubmitted = player.currentTurnExtraction !== undefined && player.currentTurnExtraction !== null;
                                return (
                                    <div key={player.id} className={styles.playerCard}>
                                        <div className={styles.playerName}>{player.name}</div>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            {gameState.showWealth && (
                                                <div className={styles.playerWealth}>
                                                    ${(player.wealth / 1000000).toFixed(1)}M
                                                </div>
                                            )}
                                            <div className={styles.statusIndicator}>
                                                {hasSubmitted ? (
                                                    <span className={styles.statusSubmitted}>✓</span>
                                                ) : (
                                                    <span className={styles.statusWaiting}>⟳</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button onClick={endGame} className="btn btn-secondary">
                            End Game
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // End Game Screens
    const winner = playerList.reduce((max, p) => p.wealth > max.wealth ? p : max, playerList[0]);
    const sortedPlayers = [...playerList].sort((a, b) => b.wealth - a.wealth);

    if (gameState.status === 'lost') {
        return (
            <div className={styles.host}>
                <div className="container text-center">
                    <h1 style={{ color: 'var(--danger)' }}>YOU ALL LOST</h1>
                    <p className="mt-md" style={{ fontSize: '1.5rem' }}>
                        The treasury ran out in turn {gameState.turn}
                    </p>

                    <div className="glass-card mt-lg">
                        <h3 className="mb-md">Final Standings</h3>
                        {sortedPlayers.map((player, idx) => (
                            <div key={player.id} className={styles.playerCard}>
                                <div className={styles.playerName}>#{idx + 1} {player.name}</div>
                                <div className={styles.playerWealth}>${(player.wealth / 1000000).toFixed(1)}M</div>
                            </div>
                        ))}
                    </div>

                    <button onClick={endGame} className="btn btn-primary mt-lg">
                        Play Again
                    </button>
                </div>
            </div>
        );
    }

    if (gameState.status === 'won') {
        return (
            <div className={styles.host}>
                <div className="container text-center">
                    <h1 style={{ color: 'var(--success)' }}>{winner.name} Won!</h1>
                    <p className="mt-md" style={{ fontSize: '1.5rem' }}>
                        With ${(winner.wealth / 1000000).toFixed(1)}M
                    </p>

                    <div className="glass-card mt-lg">
                        <h3 className="mb-md">Final Standings</h3>
                        {sortedPlayers.map((player, idx) => (
                            <div key={player.id} className={styles.playerCard}>
                                <div className={styles.playerName}>#{idx + 1} {player.name}</div>
                                <div className={styles.playerWealth}>${(player.wealth / 1000000).toFixed(1)}M</div>
                            </div>
                        ))}
                    </div>

                    <button onClick={endGame} className="btn btn-primary mt-lg">
                        Play Again
                    </button>
                </div>
            </div>
        );
    }

    return null;
}

export default function HostPage() {
    return (
        <Suspense fallback={<div className="container flex-center" style={{ minHeight: '100vh' }}>Loading...</div>}>
            <HostContent />
        </Suspense>
    );
}
