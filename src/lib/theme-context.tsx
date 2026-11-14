"use client";

import * as React from "react";

export type Theme = "light" | "dark";

export const ThemeContext = React.createContext<Theme | undefined>(undefined);

export function useTheme() {
  return React.useContext(ThemeContext);
}
