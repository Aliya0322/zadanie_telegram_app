import React from 'react';
import styles from './Navbar.module.css';

export interface NavbarProps {
  title: string;
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ title, className = '' }) => {
  return (
    <nav className={`${styles.navbar} ${className}`}>
      <div className={styles.container}>
        <div className={styles.content}>
            <h1 className={styles.title}>{title}</h1>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

