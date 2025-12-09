import { useState, useRef, useEffect } from 'react';
import styles from '@/app/play/play.module.css';

interface ActiveGameProps {
    gameState: any;
    player: any;
    onExtract: (amount: number) => void;
    onLeave: () => void;
}

export function ActiveGame({ gameState, player, onExtract, onLeave }: ActiveGameProps) {
    const [extraction, setExtraction] = useState('0');
    const lastTurnRef = useRef(0);

    const hasSubmitted = player.currentTurnExtraction !== undefined && player.currentTurnExtraction !== null;
    const maxExtraction = gameState.maxExtraction / 1000000; // In millions
    const currentAmount = extraction === '' ? 0 : parseFloat(extraction);

    // Reset extraction to 50% of max when turn changes
    useEffect(() => {
        if (gameState && gameState.turn !== lastTurnRef.current) {
            lastTurnRef.current = gameState.turn;
            if (gameState.maxExtraction) {
                const initialValue = (gameState.maxExtraction / 2000000).toFixed(1); // 50% in millions
                setExtraction(initialValue);
            }
        }
    }, [gameState?.turn, gameState?.maxExtraction]);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setExtraction(e.target.value);
    };

    const adjustExtraction = (delta: number) => {
        const newAmount = Math.min(Math.max(0, currentAmount + delta), maxExtraction);
        setExtraction(newAmount.toFixed(1));
    };

    const submitExtraction = () => {
        const amount = parseFloat(extraction) * 1000000; // Convert to actual value
        if (isNaN(amount) || amount < 0) return;

        const finalAmount = Math.min(amount, gameState.maxExtraction);
        onExtract(finalAmount);
    };

    return (
        <div className='play'>
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

                    <button onClick={onLeave} className="btn btn-secondary mt-lg" style={{ width: '100%' }}>
                        Leave Game
                    </button>
                </div>
            </div>
        </div>
    );
}
