import React, { createContext, useContext, useState, useEffect } from 'react';

const DarkModeContext = createContext(null);

export const DarkModeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('taskflow_dark') === 'true';
  });

  const toggle = () => setDarkMode(prev => {
    const next = !prev;
    localStorage.setItem('taskflow_dark', String(next));
    return next;
  });

  return (
    <DarkModeContext.Provider value={{ darkMode, toggle }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => useContext(DarkModeContext);
