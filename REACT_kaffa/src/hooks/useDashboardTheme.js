/**
 * KAFFA - Hook useDashboardTheme
 * Lee el tema (kaffaTheme) de localStorage y lo aplica a <body>
 * mediante data-theme="dark|light". Actualiza el ícono del botón.
 */
import { useEffect, useState } from 'react';

export function useDashboardTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('kaffaTheme') || 'dark');

  useEffect(() => {
    const body = document.body;
    body.removeAttribute('data-theme');
    if (theme === 'dark') body.setAttribute('data-theme', 'dark');
    return () => {
      body.removeAttribute('data-theme');
    };
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('kaffaTheme', next);
    setTheme(next);
  };

  return { theme, toggleTheme };
}
