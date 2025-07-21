import styles from './HeroSection.module.css';

export default function HeroSection() {
  return (
    <section className={styles.hero}>
      <h1 className={styles.title}>
        Wind and Hail Risk, <br /> Reimagined for Engineers
      </h1>
    </section>
  );
}
