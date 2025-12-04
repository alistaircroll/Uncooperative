'use client';

import React, { useState, useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function FishPondSimulation() {
    const [scenario, setScenario] = useState('stable');
    const [panicThreshold, setPanicThreshold] = useState(80);
    const [panicMultiplier, setPanicMultiplier] = useState(2);

    const DAYS = 30;
    const STARTING_FISH = 100;
    const GROWTH_RATE = 0.10;
    const PLAYERS = 10;
    const BASE_CONSUMPTION = 1;

    const simulation = useMemo(() => {
        const data = [];
        let fish = STARTING_FISH;
        let extinctionDay = null;

        for (let day = 1; day <= DAYS; day++) {
            const startingFish = fish;

            if (fish <= 0) {
                data.push({
                    day,
                    fish: 0,
                    consumed: 0,
                    born: 0,
                    extinct: true
                });
                continue;
            }

            // Calculate consumption based on scenario
            let consumption = 0;

            if (scenario === 'idyllic') {
                consumption = 0;
            } else if (scenario === 'stable') {
                consumption = PLAYERS * BASE_CONSUMPTION;
            } else if (scenario === 'cheater') {
                // One person eats 2, everyone else eats 1
                consumption = (PLAYERS - 1) * BASE_CONSUMPTION + 2;
            } else if (scenario === 'collapse') {
                // Starts like cheater scenario - one person takes 2
                // But when fish drop below threshold, everyone notices and panics
                if (fish < panicThreshold) {
                    // Everyone immediately starts hoarding at the panic multiplier
                    consumption = PLAYERS * BASE_CONSUMPTION * panicMultiplier;
                } else {
                    // One cheater taking an extra fish
                    consumption = (PLAYERS - 1) * BASE_CONSUMPTION + 2;
                }
            }

            // Reproduction happens first (10% of current population)
            const born = Math.round(fish * GROWTH_RATE);
            fish += born;

            // Then consumption
            const actualConsumption = Math.min(consumption, fish);
            fish -= actualConsumption;

            if (fish <= 0 && !extinctionDay) {
                extinctionDay = day;
            }

            data.push({
                day,
                fish: Math.max(0, Math.round(fish)),
                consumed: Math.round(actualConsumption * 10) / 10,
                born,
                startingFish: Math.round(startingFish),
                extinct: fish <= 0
            });
        }

        // Calculate totals
        const totalConsumed = data.reduce((sum, d) => sum + d.consumed, 0);
        const perPersonTotal = totalConsumed / PLAYERS;

        return { data, extinctionDay, totalConsumed, perPersonTotal };
    }, [scenario, panicThreshold, panicMultiplier]);

    const scenarioDescriptions = {
        idyllic: {
            title: "Idyllic: No Fishing",
            description: "The pond is left alone. Fish breed at 10% per day. Pure compound growth.",
            color: "#51cf66"
        },
        stable: {
            title: "Stable: Sustainable Harvest",
            description: "Each of 10 people eats exactly 1 fish per day. 10 born, 10 eaten. Equilibrium.",
            color: "#4a9eff"
        },
        cheater: {
            title: "Cheater: One Greedy Player",
            description: "One person secretly takes 2 fish instead of 1. What harm can one extra fish do?",
            color: "#ffc107"
        },
        collapse: {
            title: "Collapse: Panic & Hoarding",
            description: "One cheater starts the decline. When fish drop below the threshold, everyone notices and starts hoarding.",
            color: "#ff6b6b"
        }
    };

    const currentScenario = scenarioDescriptions[scenario as keyof typeof scenarioDescriptions];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            return (
                <div style={{
                    backgroundColor: 'white',
                    padding: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '13px'
                }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Day {label}</p>
                    <p style={{ color: '#4a9eff' }}>Fish in pond: {d.fish}</p>
                    <p style={{ color: '#ff6b6b' }}>Consumed: {d.consumed}</p>
                    <p style={{ color: '#51cf66' }}>Born: {d.born}</p>
                    {d.extinct && <p style={{ color: '#ff6b6b', fontWeight: 'bold' }}>EXTINCT</p>}
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif', maxWidth: '900px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                The Fish Pond Problem
            </h1>
            <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>
                A tragedy of the commons in 30 days
            </p>

            {/* Scenario Selector */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                marginBottom: '24px'
            }}>
                {Object.entries(scenarioDescriptions).map(([key, val]) => (
                    <button
                        key={key}
                        onClick={() => setScenario(key)}
                        style={{
                            padding: '12px 8px',
                            backgroundColor: scenario === key ? val.color : '#f8f9fa',
                            color: scenario === key ? 'white' : '#333',
                            border: `2px solid ${val.color}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: scenario === key ? 'bold' : 'normal',
                            fontSize: '13px',
                            transition: 'all 0.2s'
                        }}
                    >
                        {val.title.split(':')[0]}
                    </button>
                ))}
            </div>

            {/* Current Scenario Description */}
            <div style={{
                padding: '16px',
                backgroundColor: `${currentScenario.color}15`,
                borderLeft: `4px solid ${currentScenario.color}`,
                borderRadius: '0 8px 8px 0',
                marginBottom: '24px'
            }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{currentScenario.title}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>{currentScenario.description}</div>
            </div>

            {/* Collapse Controls */}
            {scenario === 'collapse' && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '20px',
                    padding: '16px',
                    backgroundColor: '#fff5f5',
                    borderRadius: '8px',
                    marginBottom: '24px'
                }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                            Panic Threshold: {panicThreshold} fish
                        </label>
                        <input
                            type="range"
                            min="30"
                            max="100"
                            value={panicThreshold}
                            onChange={(e) => setPanicThreshold(parseInt(e.target.value))}
                            style={{ width: '100%' }}
                        />
                        <div style={{ fontSize: '11px', color: '#666' }}>
                            When fish drop below this, people start hoarding
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                            Panic Multiplier: {panicMultiplier}x consumption
                        </label>
                        <input
                            type="range"
                            min="1.5"
                            max="4"
                            step="0.5"
                            value={panicMultiplier}
                            onChange={(e) => setPanicMultiplier(parseFloat(e.target.value))}
                            style={{ width: '100%' }}
                        />
                        <div style={{ fontSize: '11px', color: '#666' }}>
                            How much more people eat when panicking
                        </div>
                    </div>
                </div>
            )}

            {/* Chart */}
            <div style={{ height: '400px', marginBottom: '24px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={simulation.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis
                            dataKey="day"
                            label={{ value: 'Day', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis
                            label={{ value: 'Fish', angle: -90, position: 'insideLeft' }}
                            domain={[0, scenario === 'idyllic' ? 'auto' : Math.max(150, ...simulation.data.map(d => d.fish))]}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        {scenario === 'collapse' && (
                            <ReferenceLine
                                y={panicThreshold}
                                stroke="#ff6b6b"
                                strokeDasharray="5 5"
                                label={{ value: 'Panic threshold', position: 'right', fill: '#ff6b6b', fontSize: 11 }}
                            />
                        )}
                        <Bar
                            dataKey="fish"
                            fill={currentScenario.color}
                            name="Fish in Pond"
                            radius={[2, 2, 0, 0]}
                        />
                        <Line
                            type="monotone"
                            dataKey="consumed"
                            stroke="#ff6b6b"
                            strokeWidth={2}
                            dot={false}
                            name="Daily Consumption"
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Results */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                marginBottom: '24px'
            }}>
                <div style={{
                    padding: '16px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Final Fish Count</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: simulation.data[DAYS - 1].fish > 0 ? '#51cf66' : '#ff6b6b' }}>
                        {simulation.data[DAYS - 1].fish}
                    </div>
                </div>
                <div style={{
                    padding: '16px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Total Fish Eaten</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4a9eff' }}>
                        {Math.round(simulation.totalConsumed)}
                    </div>
                </div>
                <div style={{
                    padding: '16px',
                    backgroundColor: simulation.extinctionDay ? '#fff5f5' : '#f0fff4',
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: simulation.extinctionDay ? '2px solid #ff6b6b' : '2px solid #51cf66'
                }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        {simulation.extinctionDay ? 'Extinction Day' : 'Fish Per Person'}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: simulation.extinctionDay ? '#ff6b6b' : '#51cf66' }}>
                        {simulation.extinctionDay ? `Day ${simulation.extinctionDay}` : Math.round(simulation.perPersonTotal)}
                    </div>
                    {simulation.extinctionDay && (
                        <div style={{ fontSize: '11px', color: '#ff6b6b', marginTop: '4px' }}>
                            {Math.round(simulation.perPersonTotal)} fish per person before collapse
                        </div>
                    )}
                </div>
            </div>

            {/* Comparison Table */}
            <div style={{
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '24px'
            }}>
                <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>Scenario Comparison (30 days)</div>
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #ddd' }}>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Scenario</th>
                            <th style={{ textAlign: 'right', padding: '8px' }}>Final Fish</th>
                            <th style={{ textAlign: 'right', padding: '8px' }}>Total Eaten</th>
                            <th style={{ textAlign: 'right', padding: '8px' }}>Per Person</th>
                        </tr>
                    </thead>
                    <tbody>
                        {['idyllic', 'stable', 'cheater', 'collapse'].map(s => {
                            // Compute each scenario
                            let f = STARTING_FISH;
                            let totalEaten = 0;
                            for (let d = 1; d <= DAYS; d++) {
                                if (f <= 0) break;
                                const born = Math.round(f * GROWTH_RATE);
                                f += born;
                                let cons;
                                if (s === 'idyllic') cons = 0;
                                else if (s === 'stable') cons = PLAYERS * BASE_CONSUMPTION;
                                else if (s === 'cheater') cons = (PLAYERS - 1) * BASE_CONSUMPTION + 2;
                                else {
                                    // Collapse: cheater until threshold, then full panic
                                    if (f < panicThreshold) {
                                        cons = PLAYERS * BASE_CONSUMPTION * panicMultiplier;
                                    } else {
                                        cons = (PLAYERS - 1) * BASE_CONSUMPTION + 2;
                                    }
                                }
                                const actual = Math.min(cons, f);
                                totalEaten += actual;
                                f -= actual;
                            }
                            const icons: Record<string, string> = { idyllic: '🌿', stable: '⚖️', cheater: '🐍', collapse: '💀' };
                            const names: Record<string, string> = { idyllic: 'Idyllic', stable: 'Stable', cheater: 'Cheater', collapse: 'Collapse' };
                            const bgColors: Record<string, string> = { idyllic: '#e8f5e9', stable: '#e3f2fd', cheater: '#fff8e1', collapse: '#ffebee' };
                            return (
                                <tr key={s} style={{ backgroundColor: scenario === s ? bgColors[s] : 'transparent' }}>
                                    <td style={{ padding: '8px' }}>{icons[s]} {names[s]}</td>
                                    <td style={{ textAlign: 'right', padding: '8px', color: f <= 0 ? '#ff6b6b' : 'inherit' }}>
                                        {Math.max(0, Math.round(f)).toLocaleString()}
                                    </td>
                                    <td style={{ textAlign: 'right', padding: '8px' }}>{Math.round(totalEaten)}</td>
                                    <td style={{ textAlign: 'right', padding: '8px' }}>{Math.round(totalEaten / PLAYERS)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Insight */}
            <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                <strong>The tragedy:</strong> In the stable scenario, everyone eats 30 fish over 30 days and the pond
                remains healthy indefinitely. One cheater barely changes the total consumed (31 vs 30) but devastates
                the pond's future. And once people notice the decline and start hoarding? The pond collapses entirely,
                and everyone gets <em>less</em> than if they'd cooperated. The cheater's extra fish cost the group everything.
            </div>
        </div>
    );
}
