import argparse
import random
import itertools

def run_game(num_players, treasury, max_extraction, interest_rate, max_turns, strategies):
    """
    Simulates a single game.
    Returns: True if bankrupt, False if survived.
    """
    current_treasury = treasury
    
    for turn in range(1, max_turns + 1):
        total_extraction = 0
        
        # Players extract
        for i in range(num_players):
            strategy = strategies[i]
            extraction = strategy(current_treasury, max_extraction, interest_rate, num_players, turn, max_turns)
            # Cap at max_extraction
            extraction = min(extraction, max_extraction)
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
    """Cooperative early, greedy late (last 20% of turns)."""
    if turn > max_turns * 0.8:
        return max_extraction
    return strategy_cooperative(treasury, max_extraction, interest_rate, num_players, turn, max_turns)

def strategy_defector(treasury, max_extraction, interest_rate, num_players, turn, max_turns):
    """Mostly cooperative, but defects (takes max) with 20% probability."""
    if random.random() < 0.2:
        return max_extraction
    return strategy_cooperative(treasury, max_extraction, interest_rate, num_players, turn, max_turns)

# --- Simulation ---

def simulate_batch(num_games, num_players, treasury, max_extraction, interest_rate, max_turns, player_mix):
    bankruptcies = 0
    for _ in range(num_games):
        current_strategies = list(player_mix)
        random.shuffle(current_strategies)
        if run_game(num_players, treasury, max_extraction, interest_rate, max_turns, current_strategies):
            bankruptcies += 1
    return bankruptcies / num_games

def tune_parameters(num_players, num_games):
    print(f"\n--- Tuning for {num_players} Players ---")
    
    # Define search space
    treasury_opts = [40000000, 50000000, 60000000, 70000000, 80000000, 100000000] # 40M - 100M
    extraction_opts = [2000000, 3000000, 4000000, 5000000, 6000000] # 2M - 6M
    interest_opts = [0.05, 0.10, 0.15, 0.20] # 5% - 20%
    turns_opts = [8, 10, 12, 15]
    
    # Strategy Mix: 1 Greedy, rest Opportunistic/Defector mix
    # This simulates a "mostly cooperative but fragile" group
    strategies = [strategy_greedy] 
    for _ in range(num_players - 1):
        strategies.append(random.choice([strategy_opportunistic, strategy_defector]))
        
    best_diff = 1.0
    best_params = None
    best_rate = 0.0
    
    combinations = list(itertools.product(treasury_opts, extraction_opts, interest_opts, turns_opts))
    # Randomly sample 200 combinations to save time if space is huge, but here it's 6*5*4*4 = 480, which is manageable.
    
    print(f"Scanning {len(combinations)} parameter combinations...")
    
    for t, e, i, turns in combinations:
        rate = simulate_batch(num_games, num_players, t, e, i, turns, strategies)
        diff = abs(rate - 0.5)
        
        if diff < best_diff:
            best_diff = diff
            best_params = (t, e, i, turns)
            best_rate = rate
            
            # Optimization: If we find something very close to 0.5, stop early?
            # No, let's find the absolute best.
            
    print(f"Best Match: Treasury=${best_params[0]/1e6:.0f}M, MaxExtract=${best_params[1]/1e6:.1f}M, Interest={best_params[2]*100:.0f}%, Turns={best_params[3]}")
    print(f"Resulting Bankruptcy Rate: {best_rate*100:.1f}%")
    
    return best_params

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--games", type=int, default=500, help="Games per batch")
    args = parser.parse_args()
    
    results = {}
    for p in [3, 4, 5]:
        results[p] = tune_parameters(p, args.games)
        
    print("\n\n=== OPTIMAL PARAMETERS ===")
    for p, params in results.items():
        print(f"{p} Players: Treasury=${params[0]/1e6:.0f}M, MaxExtract=${params[1]/1e6:.1f}M, Interest={params[2]*100:.0f}%, Turns={params[3]}")
