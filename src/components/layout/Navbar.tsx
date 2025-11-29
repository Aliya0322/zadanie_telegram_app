import React from 'react';
import styles from './Navbar.module.css';

export interface NavbarProps {
  title: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ title, left, right, className = '' }) => {
  return (
    <nav className={`${styles.navbar} ${className}`}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.leftSection}>
            {left && <div className={styles.leftContent}>{left}</div>}
            <h1 className={styles.title}>{title}</h1>
          </div>
          {right && <div>{right}</div>}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

