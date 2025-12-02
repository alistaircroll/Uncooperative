'use client';

import { useRouter } from 'next/navigation';
import { ref, push } from 'firebase/database';
import { database } from '@/lib/firebase';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();

  const createGame = async () => {
    try {
      // Create a new game in Firebase
      const gamesRef = ref(database, 'games');
      const newGameRef = push(gamesRef, {
        treasury: 40000000, // $40M
        turn: 0,
        maxExtraction: 5000000, // $5M
        interestRate: 0.10, // 10%
        status: 'waiting', // waiting, playing, won, lost
        turnPhase: null, // extracting, summary, calculating
        showWealth: false, // Toggle for showing player wealth on main display
        players: {},
        createdAt: Date.now()
      });

      // Redirect to host page with game ID
      router.push(`/host?id=${newGameRef.key}`);
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Failed to create game. Please check Firebase configuration.');
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className="fade-in">
          <h1 className="text-center">UNCOOPERATIVE</h1>
          <p className="text-center mt-md" style={{ maxWidth: '600px', margin: '1.5rem auto' }}>
            A game of cooperation and greed. Extract money from the treasury to win,
            but if the treasury runs out, everyone loses.
          </p>

          <div className={styles.ctas}>
            <button
              onClick={createGame}
              className="btn btn-primary"
            >
              Create New Game
            </button>

            <button
              onClick={() => router.push('/play')}
              className="btn btn-secondary"
            >
              Join Game
            </button>
          </div>

          <div className="glass-card mt-lg" style={{ maxWidth: '600px', margin: '3rem auto' }}>
            <h3 className="mb-sm">How to Play</h3>
            <ol style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
              <li>Create a game and share the QR code with players</li>
              <li>Players scan the code to join on their phones</li>
              <li>Each turn, players extract money from the treasury</li>
              <li>The treasury earns interest after each turn</li>
              <li>Win by having the most money when the game ends</li>
              <li>But if the treasury runs out, everyone loses!</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}
