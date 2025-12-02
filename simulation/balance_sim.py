import argparse
import random
import statistics

def run_game(num_players, treasury, max_extraction, interest_rate, max_turns, strategies):
    """
    Simulates a single game.
    strategies: list of strategy functions for each player.
    Returns: True if bankrupt, False if survived.
    """
    current_treasury = treasury
    
    for turn in range(1, max_turns + 1):
        total_extraction = 0
        
        # Players extract
        for i in range(num_players):
            strategy = strategies[i]
            # Strategy takes current game state and returns extraction amount
            extraction = strategy(current_treasury, max_extraction, interest_rate, num_players, turn, max_turns)
            # Cap at max_extraction and current treasury (though game allows over-extraction leading to bankruptcy)
            # In the real game, you can request max_extraction even if treasury is lower, 
            # but you can't get more than what's in there? 
            # Actually, if total requests > treasury, treasury goes to 0 and game ends.
            total_extraction += extraction
            
        current_treasury -= total_extraction
        
        if current_treasury <= 0:
            return True # Bankrupt
            
        # Interest
        interest = current_treasury * interest_rate
        current_treasury += interest
        
    return False # Survived

# --- Strategies ---

def strategy_greedy(treasury, max_extraction, interest_rate, num_players, turn, max_turns):
    """Always takes maximum."""
    return max_extraction

def strategy_cooperative(treasury, max_extraction, interest_rate, num_players, turn, max_turns):
    """Takes a sustainable amount (interest / players)."""
    sustainable = (treasury * interest_rate) / num_players
    return min(sustainable, max_extraction)

def strategy_random(treasury, max_extraction, interest_rate, num_players, turn, max_turns):
    """Takes a random amount between 0 and max."""
    return random.uniform(0, max_extraction)

def strategy_opportunistic(treasury, max_extraction, interest_rate, num_players, turn, max_turns):
    """Cooperative early, greedy late."""
    if turn > max_turns * 0.7:
        return max_extraction
    return strategy_cooperative(treasury, max_extraction, interest_rate, num_players, turn, max_turns)

def strategy_defector(treasury, max_extraction, interest_rate, num_players, turn, max_turns):
    """Mostly cooperative, but defects randomly."""
    if random.random() < 0.2:
        return max_extraction
    return strategy_cooperative(treasury, max_extraction, interest_rate, num_players, turn, max_turns)

# --- Simulation ---

def simulate_batch(num_games, num_players, treasury, max_extraction, interest_rate, max_turns, player_mix):
    """
    Runs a batch of games and returns bankruptcy rate.
    player_mix: list of strategy functions (length must match num_players)
    """
    bankruptcies = 0
    for _ in range(num_games):
        # Shuffle strategies to avoid position bias if any (though simultaneous)
        current_strategies = list(player_mix)
        random.shuffle(current_strategies)
        if run_game(num_players, treasury, max_extraction, interest_rate, max_turns, current_strategies):
            bankruptcies += 1
            
    return bankruptcies / num_games

def autotune(num_players, num_games, scan_range_mult=2.0):
    """
    Attempts to find parameters that result in ~50% bankruptcy.
    We fix Interest Rate and Max Turns, and tune Treasury and Max Extraction.
    """
    print(f"\n--- Autotuning for {num_players} Players ---")
    
    # Fixed parameters
    interest_rate = 0.10
    max_turns = 10
    
    # Initial guesses
    start_treasury = 100000000 # 100M
    start_max_extract = 5000000 # 5M
    
    # Define a "Standard Mix" of players for balancing
    # e.g., 1 Greedy, rest Defectors/Opportunistic? 
    # If everyone is cooperative, it never ends. If everyone is greedy, it ends instantly.
    # Let's assume a mix of "Rational but Selfish" players.
    # 1 Greedy, (N-1) Opportunistic seems like a good stress test.
    strategies = [strategy_greedy] + [strategy_opportunistic] * (num_players - 1)
    
    best_diff = 1.0
    best_params = (start_treasury, start_max_extract)
    best_rate = 0.0
    
    # Scan ranges
    treasury_options = [start_treasury * m for m in [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]]
    extract_options = [start_max_extract * m for m in [0.5, 0.75, 1.0, 1.5, 2.0, 3.0]]
    
    print(f"Scanning {len(treasury_options) * len(extract_options)} combinations...")
    
    for t in treasury_options:
        for e in extract_options:
            rate = simulate_batch(num_games, num_players, t, e, interest_rate, max_turns, strategies)
            diff = abs(rate - 0.5)
            
            # print(f"  Treasury: ${t/1e6}M, MaxExtract: ${e/1e6}M -> Bankruptcy: {rate*100:.1f}%")
            
            if diff < best_diff:
                best_diff = diff
                best_params = (t, e)
                best_rate = rate
                
    print(f"Best Match: Treasury=${best_params[0]/1e6}M, MaxExtract=${best_params[1]/1e6}M")
    print(f"Resulting Bankruptcy Rate: {best_rate*100:.1f}%")
    
    return best_params

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Uncooperative Game Balance Simulator")
    parser.add_argument("--games", type=int, default=1000, help="Number of games to simulate per batch")
    parser.add_argument("--players", type=str, default="3,4,5", help="Comma-separated list of player counts to tune for")
    
    args = parser.parse_args()
    
    player_counts = [int(x) for x in args.players.split(",")]
    
    results = {}
    
    for p in player_counts:
        results[p] = autotune(p, args.games)
        
    print("\n\n=== RECOMMENDED DEFAULTS ===")
    for p, params in results.items():
        print(f"{p} Players: Treasury=${params[0]/1e6:.0f}M, Max Extraction=${params[1]/1e6:.1f}M, Interest=10%")
