import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export default function BackToTop() {
  const { motion } = useTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 600);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({
      top: 0,
      behavior: motion === 'off' ? 'auto' : 'smooth',
    });
  };

  return (
    <button
      id="back-to-top"
      type="button"
      onClick={handleClick}
      aria-label="Back to top"
      title="Back to top"
      className={visible ? 'show' : ''}
    >
      <ArrowUp className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
