"use client";

import { useState, useEffect } from "react";

export interface LiveData {
  ph: number;
  temp: number;
  do2: number;
  biomass: number;
  efficiency: number;
  volume: number;
  cycle: number;
  maint: number;
  co2: number;
  o2: number;
  air: number;
  uptime: string;
  growth: number;
}

export function useLiveData(): LiveData {
  const [d, setD] = useState<LiveData>({
    ph: 6.96, temp: 28.6, do2: 7.2, biomass: 2.4,
    efficiency: 98, volume: 450, cycle: 14, maint: 28,
    co2: 48.2, o2: 36.1, air: 2848, uptime: "14d 14h 50m", growth: 2.1,
  });
  useEffect(() => {
    const id = setInterval(() => setD(p => ({
      ...p,
      ph: +(p.ph + (Math.random() - 0.5) * 0.02).toFixed(2),
      temp: +(p.temp + (Math.random() - 0.5) * 0.1).toFixed(1),
      do2: +(p.do2 + (Math.random() - 0.5) * 0.1).toFixed(1),
      biomass: +(p.biomass + (Math.random() - 0.5) * 0.05).toFixed(1),
      co2: +(p.co2 + Math.random() * 0.05).toFixed(1),
      o2: +(p.o2 + Math.random() * 0.03).toFixed(1),
      air: Math.round(p.air + Math.random() * 2),
    })), 3000);
    return () => clearInterval(id);
  }, []);
  return d;
}
