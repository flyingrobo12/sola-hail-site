'use client';
import Link from 'next/link';
import styles from './navbar.module.css';

export default function Navbar() {
  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link href="/">sola</Link>
        </div>
        <nav className={styles.links}>
          <Link href="#final-answer">Final Answer</Link>
          <Link href="#methodology">Methodology</Link>
          <Link href="#code">Code Walk-Through</Link>
          <Link href="#ideation">Ideation Process</Link>
        </nav>
      </div>
    </header>
  );
}
