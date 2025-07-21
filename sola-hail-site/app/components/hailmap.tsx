'use client';
import React, { useEffect, useState } from 'react';

interface HailMapProps {
  year: string;
}

export default function HailMap({ year }: HailMapProps) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/hail/${year}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError('Failed to load GeoJSON data');
      }
    }
    fetchData();
  }, [year]);

  if (error) return <div>{error}</div>;
  if (!data) return <div>Loading map data for {year}…</div>;

  // Example rendering
  return (
    <div>
      <h3>GeoJSON Features for {year}:</h3>
      <ul>
        {data.features?.map((feature: any, i: number) => (
          <li key={i}>
            {feature.properties?.event_id || 'Unnamed event'} –{' '}
            {feature.geometry?.type}
          </li>
        ))}
      </ul>
    </div>
  );
}
