'use client';

import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts';

export default function OptimalExtraction() {
    const [players, setPlayers] = useState(4);
    const [startingTreasury, setStartingTreasury] = useState(60);
    const [interestRate, setInterestRate] = useState(10);
    const [maxExtraction, setMaxExtraction] = useState(5);
    const [turns, setTurns] = useState(10);
    const [extractionPerPlayer, setExtractionPerPlayer] = useState(2.5);

    const simulation = useMemo(() => {
        const rate = interestRate / 100;
        const totalExtraction = extractionPerPlayer * players;

        let treasury = startingTreasury;
        let cumulativePlayerWealth = 0;
        const data = [];
        let bankruptTurn = null;

        for (let turn = 1; turn <= turns; turn++) {
            const startingValue = treasury;

            // Check if extraction would cause bankruptcy
            const actualExtraction = Math.min(totalExtraction, Math.max(0, treasury));

            if (treasury <= 0) {
                bankruptTurn = bankruptTurn || turn;
                data.push({
                    turn,
                    startingTreasury: 0,
                    extraction: 0,
                    interest: 0,
                    playerWealth: cumulativePlayerWealth / players,
                    bankrupt: true
                });
                continue;
            }

            // Extraction happens first
            treasury -= actualExtraction;
            cumulativePlayerWealth += actualExtraction;

            // Then interest accrues on remaining treasury
            const interest = treasury * rate;
            treasury += interest;

            data.push({
                turn,
                startingTreasury: Math.max(0, startingValue - actualExtraction),
                extraction: actualExtraction,
                interest: interest,
                playerWealth: cumulativePlayerWealth / players,
                treasuryEnd: treasury,
                bankrupt: treasury <= 0
            });

            if (treasury <= 0) {
                bankruptTurn = turn;
            }
        }

        return {
            data,
            finalTreasury: Math.max(0, treasury),
            finalPlayerWealth: cumulativePlayerWealth / players,
            totalExtracted: cumulativePlayerWealth,
            bankruptTurn
        };
    }, [players, startingTreasury, interestRate, maxExtraction, turns, extractionPerPlayer]);

    // Calculate optimal extraction rate - maximize EXTRACTED wealth, not system wealth
    // Treasury at end should be ~$0 (anything left is wasted)
    const optimalExtraction = useMemo(() => {
        const rate = interestRate / 100;
        let bestExtraction = 0;
        let bestTotalExtracted = 0;

        // Search for optimal extraction per player
        // We want to drain the treasury to exactly $0 on the final turn
        for (let testExtraction = 0; testExtraction <= maxExtraction; testExtraction += 0.01) {
            let treasury = startingTreasury;
            let totalExtracted = 0;
            const totalExtractionPerTurn = testExtraction * players;

            for (let turn = 1; turn <= turns; turn++) {
                if (treasury <= 0) break;

                const actualExtraction = Math.min(totalExtractionPerTurn, Math.max(0, treasury));
                treasury -= actualExtraction;
                totalExtracted += actualExtraction;
                treasury += treasury * rate;
            }

            // We want to maximize extracted wealth
            if (totalExtracted > bestTotalExtracted) {
                bestTotalExtracted = totalExtracted;
                bestExtraction = testExtraction;
            }
        }

        return { extraction: bestExtraction, totalExtracted: bestTotalExtracted };
    }, [players, startingTreasury, interestRate, maxExtraction, turns]);

    const formatCurrency = (value: number) => `$${value.toFixed(2)}M`;

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div style={{
                    backgroundColor: 'white',
                    padding: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '13px'
                }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Turn {label}</p>
                    <p style={{ color: '#4a9eff' }}>Treasury (post-extraction): {formatCurrency(data.startingTreasury)}</p>
                    <p style={{ color: '#ff6b6b' }}>Total Extraction: {formatCurrency(data.extraction)}</p>
                    <p style={{ color: '#51cf66' }}>Interest Earned: {formatCurrency(data.interest)}</p>
                    <p style={{ color: '#9b59b6', marginTop: '8px', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                        Player Wealth: {formatCurrency(data.playerWealth)}
                    </p>
                    <p style={{ color: '#333' }}>Treasury End: {formatCurrency(data.treasuryEnd || 0)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif', maxWidth: '900px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                Cooperative Extraction Optimizer
            </h1>
            <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>
                Finding the optimal extraction rate for perfectly cooperating players
            </p>

            {/* Chart */}
            <div style={{ height: '400px', marginBottom: '24px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={simulation.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis
                            dataKey="turn"
                            label={{ value: 'Turn', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis
                            label={{ value: 'Value ($M)', angle: -90, position: 'insideLeft' }}
                            domain={[0, 'auto']}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="startingTreasury" stackId="treasury" fill="#4a9eff" name="Treasury (post-extraction)" />
                        <Bar dataKey="extraction" stackId="treasury" fill="#ff6b6b" name="Total Extraction" />
                        <Bar dataKey="interest" stackId="treasury" fill="#51cf66" name="Interest" />
                        <Line
                            type="monotone"
                            dataKey="playerWealth"
                            stroke="#9b59b6"
                            strokeWidth={3}
                            dot={{ fill: '#9b59b6', r: 4 }}
                            name="Player Wealth (each)"
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Results Display */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                marginBottom: '24px'
            }}>
                <div style={{
                    padding: '16px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Wealth Per Player</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9b59b6' }}>
                        {formatCurrency(simulation.finalPlayerWealth)}
                    </div>
                </div>
                <div style={{
                    padding: '16px',
                    backgroundColor: simulation.bankruptTurn && simulation.bankruptTurn < turns ? '#fff5f5' : '#f0fff4',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: simulation.bankruptTurn && simulation.bankruptTurn < turns ? '2px solid #ff6b6b' : '2px solid #51cf66'
                }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Total Extracted Wealth</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: simulation.bankruptTurn && simulation.bankruptTurn < turns ? '#ff6b6b' : '#51cf66' }}>
                        {formatCurrency(simulation.totalExtracted)}
                    </div>
                    {simulation.bankruptTurn && simulation.bankruptTurn < turns && (
                        <div style={{ fontSize: '11px', color: '#ff6b6b', marginTop: '4px' }}>
                            Bankrupt on turn {simulation.bankruptTurn} — extraction too aggressive
                        </div>
                    )}
                    {simulation.finalTreasury > 0.5 && (
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                            ${simulation.finalTreasury.toFixed(2)}M left in treasury (wasted)
                        </div>
                    )}
                </div>
            </div>

            {/* Optimal Extraction Info */}
            <div style={{
                padding: '16px',
                backgroundColor: '#fff8e6',
                borderRadius: '8px',
                marginBottom: '24px',
                border: '1px solid #ffc107'
            }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#856404' }}>
                    Optimal Strategy (for these parameters)
                </div>
                <div style={{ fontSize: '14px', color: '#856404' }}>
                    Each player should extract <strong>${optimalExtraction.extraction.toFixed(2)}M</strong> per turn
                    to maximize total extracted wealth of <strong>${optimalExtraction.totalExtracted.toFixed(2)}M</strong>
                </div>
                <button
                    onClick={() => setExtractionPerPlayer(optimalExtraction.extraction)}
                    style={{
                        marginTop: '8px',
                        padding: '8px 16px',
                        backgroundColor: '#ffc107',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        color: '#856404'
                    }}
                >
                    Apply Optimal Rate
                </button>
            </div>

            {/* Controls */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '20px',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
            }}>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                        Extraction Per Player: ${extractionPerPlayer.toFixed(1)}M
                    </label>
                    <input
                        type="range"
                        min="0"
                        max={maxExtraction}
                        step="0.1"
                        value={extractionPerPlayer}
                        onChange={(e) => setExtractionPerPlayer(parseFloat(e.target.value))}
                        style={{ width: '100%' }}
                    />
                    <div style={{ fontSize: '11px', color: '#666' }}>
                        Total extraction: ${(extractionPerPlayer * players).toFixed(1)}M/turn
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                        Number of Players: {players}
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="9"
                        value={players}
                        onChange={(e) => setPlayers(parseInt(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                        Starting Treasury: ${startingTreasury}M
                    </label>
                    <input
                        type="range"
                        min="30"
                        max="150"
                        step="5"
                        value={startingTreasury}
                        onChange={(e) => setStartingTreasury(parseInt(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                        Interest Rate: {interestRate}%
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="20"
                        value={interestRate}
                        onChange={(e) => setInterestRate(parseInt(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                        Max Extraction: ${maxExtraction}M
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={maxExtraction}
                        onChange={(e) => {
                            const newMax = parseInt(e.target.value);
                            setMaxExtraction(newMax);
                            if (extractionPerPlayer > newMax) setExtractionPerPlayer(newMax);
                        }}
                        style={{ width: '100%' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                        Number of Turns: {turns}
                    </label>
                    <input
                        type="range"
                        min="5"
                        max="15"
                        value={turns}
                        onChange={(e) => setTurns(parseInt(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>
            </div>

            {/* Explanation */}
            <div style={{ marginTop: '24px', fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                <strong>How it works:</strong> Each turn, players extract from the treasury, then interest accrues on what remains.
                The stacked bars show treasury composition (blue = remaining treasury, red = extraction, green = interest gained).
                The purple line tracks cumulative wealth per player. The optimal strategy extracts at a rate that drains
                the treasury to exactly $0 on the final turn — any money left in the treasury is wasted, but extracting
                too aggressively causes early bankruptcy and forfeits future interest.
            </div>
        </div>
    );
}
