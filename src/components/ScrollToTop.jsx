import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component:
 * 1. Automatically scrolls window to top on route change.
 * 2. Renders a smooth, floating "Scroll To Top" button when scrolled down > 280px.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scroll to top automatically on route changes
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }, [pathname]);

  // Monitor window scroll position to toggle the floating button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 280) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTopSmoothly = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      type="button"
      id="scroll-to-top-btn"
      className={`scroll-to-top-button ${showScrollTop ? 'visible' : ''}`}
      onClick={scrollToTopSmoothly}
      aria-label="Scroll back to top of page"
      title="Scroll to top"
    >
      <span className="scroll-arrow">↑</span>
      <span className="scroll-tooltip">Top</span>
    </button>
  );
};

export default ScrollToTop;
