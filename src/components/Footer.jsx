import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p>&copy; {new Date().getFullYear()} HireSphere AI &mdash; Real-Time Autonomous Talent Platform. All rights reserved.</p>
        <p className="footer-subtext">Empowering candidates and recruiters with persistent real-time intelligence and autonomous AI coaching.</p>
      </div>
    </footer>
  );
};

export default Footer;
