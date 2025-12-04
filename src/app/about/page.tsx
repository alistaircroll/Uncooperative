import Link from 'next/link';
import styles from './about.module.css';

export default function AboutPage() {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h1 className={styles.title}>About Uncooperative</h1>

                <div className={styles.card}>
                    <p className={styles.largeText}>
                        Cooperating is hard. When a bunch of people share a finite resource, but act selfishly, everyone is eventually worse off. On the other hand, the cheater does better than everyone else—so everyone cheats.
                    </p>

                    <div className={styles.actions}>
                        <a href="#how-to-play" className={styles.button}>
                            Jump to instructions
                        </a>
                    </div>
                </div>

                <div className={styles.card}>
                    <p>
                        This is a classic coordination problem: If everyone follows the rules, the benefits are great. But because people act in their own self-interest, the end result sucks.
                    </p>

                    <p>
                        Imagine you have a pond with 100 fish in it. Every day, the fish have 10 full-sized babies (10% growth). If you leave the pond alone, the population will grow quickly. On day 2 you'll have 110 fish; on day 3, you'll have 121 fish; and after 20 days, thanks to the magic of compound interest, you'll have 672 fish!
                    </p>

                    <p>
                        But you and your 9 friends are hungry. If you all just eat one fish a day, you'll eat fish forever. 10 fish produced, 10 fish eaten. Everyone is happy.
                    </p>

                    <p>
                        Except one of your friends decides he's hungry. He grabs a second fish. There are plenty of fish in the pond; what damage can one fish do?
                    </p>

                    <p>
                        By turn 20, you're now down to 42 fish in the pond. You're all starving by day 26.
                    </p>

                    <p>
                        Except it's worse than that: After a few days, some of your friends notice that the fish are disappearing. So they decide to start hoarding fish and taking more than their fair share. Other people are cheating, so why shouldn't they?
                    </p>

                    <p>
                        Here's a simple simulation that lets you see these four scenarios, and what happens when people notice the fish are disappearing and panic:
                    </p>

                    <div className={styles.artifactLink}>
                        <a
                            href="https://claude.ai/public/artifacts/2c44025e-1546-4020-9acb-fa0dadd358bb"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.artifactButton}
                        >
                            🐟 Open Fish Pond Simulation
                        </a>
                    </div>

                    <p>
                        The fish pond became a competitive game. The only way to better than others is to break the rules.
                    </p>

                    <p>
                        There's a field of economics called Game Theory that explores how these competitive games play out, and what the best strategies are. Of course, most games aren't about fish: They're about things like money, power, and the environment.
                    </p>

                    <p>
                        (There's even a shorthand name for coordination problems: Moloch. If you want to learn more about this, check out <a href="https://youtu.be/KCSsKV5F4xc" target="_blank" rel="noopener noreferrer">Liv Boeree's amazing discussion with Daniel Schmachtenberger</a> on the subject. And check out <a href="https://online.hbs.edu/blog/post/tragedy-of-the-commons-impact-on-sustainability-issues" target="_blank" rel="noopener noreferrer">this HBS article with five Tragedy of the Commons examples</a>.)
                    </p>

                    <p>
                        As you might expect, coordination problems mean a lot of negotiation. Alliances form. Things escalate and de-escalate. The few get rich, the many get out their pitchforks. If you've ever played Werewolf, you have a sense of what it's like first-hand: With imperfect knowledge, groups make bad decisions.
                    </p>
                </div>

                <div className={styles.card} id="how-to-play">
                    <h2 className={styles.sectionTitle}>How to play</h2>

                    <p>
                        In Uncooperative, players extract money from a treasury each turn. And each turn, the treasury earns interest. The winner is the person with the most money at the end of the game.
                    </p>

                    <p>
                        But there's a catch: If the treasury ever runs out, the game is over, and everyone loses. Since each player doesn't know how much the other players took, they have to coordinate.
                    </p>

                    <p>
                        If everyone cooperates, there's an optimal strategy to get as much wealth as possible. Play with the sliders in the graph below to see how things play out, and click "Apply Optimal Rate" to see the maximum total wealth you can get.
                    </p>

                    <div className={styles.artifactLink}>
                        <a
                            href="https://claude.ai/public/artifacts/c01cd897-074c-4dc9-beb3-7887f8ecf9b0"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.artifactButton}
                        >
                            📊 Open Optimal Strategy Calculator
                        </a>
                    </div>

                    <p>
                        The question is: Can you do better than everyone else without breaking the bank?
                    </p>

                    <p>
                        The winning strategy depends on the interest rate, the maximum extraction amount, the number of turns, and the starting treasury. The game will suggest optimal values for these based on the number of players, but you can edit them on the starting screen to experiment if you want to.
                    </p>

                    <p>
                        To begin, simply have your players scan the QR code on their phones and enter their names, then click "Start Game". To clear the players who are signed in click "Clear Players".
                    </p>
                </div>

                <div className={styles.card}>
                    <h2 className={styles.sectionTitle}>Credits</h2>
                    <p>
                        Uncooperative was created by <a href="https://alistaircroll.com/" target="_blank" rel="noopener noreferrer">Alistair Croll</a>.
                    </p>
                </div>

                <div className={styles.actions}>
                    <Link href="/" className={styles.button}>
                        Return to Game
                    </Link>
                </div>
            </div>
        </div>
    );
}
