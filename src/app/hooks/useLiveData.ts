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
  /* Environment */
  ambientTemp: number;
  humidity: number;
  lightIntensity: number;
  co2Ambient: number;
  uvIndex: number;
  airQuality: number;
  /* Performance */
  photosynthRate: number;
  carbonFixRate: number;
  oxygenProd: number;
  energyUsage: number;
  waterUsage: number;
  nutrientEff: number;
  weeklyBiomass: number[];
  weeklyEnergy: number[];
  /* System */
  cpuTemp: number;
  cpuUsage: number;
  memUsage: number;
  diskUsage: number;
  networkUp: boolean;
  pumpStatus: string;
  ledStatus: string;
  sensorHealth: number;
  lastCalibration: string;
  firmwareVersion: string;
}

export function useLiveData(): LiveData {
  const [d, setD] = useState<LiveData>({
    ph: 6.96, temp: 28.6, do2: 7.2, biomass: 2.4,
    efficiency: 98, volume: 450, cycle: 14, maint: 28,
    co2: 48.2, o2: 36.1, air: 2848, uptime: "14d 14h 50m", growth: 2.1,
    /* Environment */
    ambientTemp: 24.3, humidity: 62, lightIntensity: 8400,
    co2Ambient: 412, uvIndex: 3.2, airQuality: 92,
    /* Performance */
    photosynthRate: 14.6, carbonFixRate: 3.8, oxygenProd: 5.2,
    energyUsage: 127, waterUsage: 2.1, nutrientEff: 94,
    weeklyBiomass: [1.8, 2.0, 1.9, 2.2, 2.1, 2.3, 2.4],
    weeklyEnergy: [122, 118, 130, 125, 127, 131, 127],
    /* System */
    cpuTemp: 48.2, cpuUsage: 23, memUsage: 41,
    diskUsage: 34, networkUp: true, pumpStatus: "Running",
    ledStatus: "Active", sensorHealth: 100,
    lastCalibration: "2d ago", firmwareVersion: "v3.2.1",
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
      ambientTemp: +(p.ambientTemp + (Math.random() - 0.5) * 0.15).toFixed(1),
      humidity: +(p.humidity + (Math.random() - 0.5) * 0.3).toFixed(0),
      lightIntensity: Math.round(p.lightIntensity + (Math.random() - 0.5) * 50),
      co2Ambient: Math.round(p.co2Ambient + (Math.random() - 0.5) * 3),
      cpuTemp: +(p.cpuTemp + (Math.random() - 0.5) * 0.2).toFixed(1),
      cpuUsage: Math.min(100, Math.max(5, Math.round(p.cpuUsage + (Math.random() - 0.5) * 2))),
      energyUsage: Math.round(p.energyUsage + (Math.random() - 0.5) * 2),
      photosynthRate: +(p.photosynthRate + (Math.random() - 0.5) * 0.1).toFixed(1),
      oxygenProd: +(p.oxygenProd + (Math.random() - 0.5) * 0.05).toFixed(1),
    })), 3000);
    return () => clearInterval(id);
  }, []);
  return d;
}
