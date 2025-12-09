import { useState } from 'react';

interface PlayerJoinProps {
    onJoin: (name: string) => void;
}

export function PlayerJoin({ onJoin }: PlayerJoinProps) {
    const [name, setName] = useState('');

    const submit = () => {
        if (name.trim()) {
            onJoin(name);
        }
    };

    return (
        <div className="container flex-center" style={{ minHeight: '100vh' }}>
            <div className="glass-card" style={{ maxWidth: '400px', width: '100%' }}>
                <h2 className="text-center mb-md">Sign In</h2>
                <p className="text-center mb-md">Enter your name to join the game</p>

                <input
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && submit()}
                    autoFocus
                />

                <button
                    onClick={submit}
                    disabled={!name.trim()}
                    className="btn btn-primary mt-md"
                    style={{ width: '100%' }}
                >
                    Sign In
                </button>
            </div>
        </div>
    );
}
