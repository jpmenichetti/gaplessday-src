import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface SimulatedTimeContextType {
  simulatedDate: Date | null;
  setSimulatedDate: (date: Date | null) => void;
  getNow: () => Date;
}

const SimulatedTimeContext = createContext<SimulatedTimeContextType | null>(null);

export function SimulatedTimeProvider({ children }: { children: ReactNode }) {
  const [simulatedDate, setSimulatedDate] = useState<Date | null>(null);

  const getNow = useCallback(() => {
    return simulatedDate ? new Date(simulatedDate) : new Date();
  }, [simulatedDate]);

  return (
    <SimulatedTimeContext.Provider value={{ simulatedDate, setSimulatedDate, getNow }}>
      {children}
    </SimulatedTimeContext.Provider>
  );
}

export function useSimulatedTime() {
  const ctx = useContext(SimulatedTimeContext);
  if (!ctx) throw new Error("useSimulatedTime must be used within SimulatedTimeProvider");
  return ctx;
}
