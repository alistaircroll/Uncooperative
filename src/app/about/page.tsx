import Link from 'next/link';
import styles from './about.module.css';

export default function AboutPage() {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h1 className={styles.title}>About Uncooperative</h1>

                <div className={styles.card}>
                    <p className={styles.placeholder}>
                        Placeholder text for uncooperative documentation and explanation
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
