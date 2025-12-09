interface PlayerLobbyProps {
    playerName: string;
    onLeave: () => void;
}

export function PlayerLobby({ playerName, onLeave }: PlayerLobbyProps) {
    return (
        <div className="container flex-center" style={{ minHeight: '100vh' }}>
            <div className="glass-card text-center">
                <h2>Welcome, {playerName}!</h2>
                <p className="mt-md pulse">Waiting for game to start...</p>

                <button onClick={onLeave} className="btn btn-secondary mt-lg">
                    Leave Game
                </button>
            </div>
        </div>
    );
}
