'use client';

import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  analyser: AnalyserNode;
}

export default function AudioVisualizer({ analyser }: AudioVisualizerProps) {
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const body = document.body;
    if (!analyser || !body) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const animate = () => {
      analyser.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i += 8) {
        const v = dataArray[i] - 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / (dataArray.length / 8)) / 128;
      const intensity = Math.min(1, rms * 4);
      body.style.setProperty('--wave-intensity', intensity.toString());
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
      body.style.removeProperty('--wave-intensity');
    };
  }, [analyser]);

  return null;
}
