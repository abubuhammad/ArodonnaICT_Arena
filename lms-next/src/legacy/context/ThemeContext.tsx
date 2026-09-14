// frontend/src/context/ThemeContext.tsx
import React, { createContext, useEffect, useState } from "react";
import axios from "axios";

export interface ThemeConfig {
  _id?: string; // optional _id for compatibility with ManageTheme
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundGradient: string;
  fontFamily?: string;
}

interface ThemeContextProps {
  theme: ThemeConfig | null;
  refreshTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextProps>({
  theme: null,
  refreshTheme: () => {},
});

export const ThemeProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeConfig | null>(null);

  const fetchTheme = async () => {
    try {
      const response = await axios.get<ThemeConfig>("/api/theme");
      setTheme(response.data);
    } catch (error) {
      console.error("Error fetching theme:", error);
    }
  };

  const refreshTheme = () => {
    fetchTheme();
  };

  useEffect(() => {
    fetchTheme();
  }, []);

  useEffect(() => {
    if (theme) {
      const root = document.documentElement;
      root.style.setProperty("--primary-color", theme.primaryColor);
      root.style.setProperty("--secondary-color", theme.secondaryColor);
      root.style.setProperty("--background-gradient", theme.backgroundGradient);
      if (theme.fontFamily) {
        root.style.setProperty("--font-family", theme.fontFamily);
      }
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
