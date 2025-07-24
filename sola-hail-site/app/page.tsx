'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface EnhancedPayout {
  Year: string;
  Hit: boolean;
  Distance_m: number;
  AreaMultiplier: number;
  DirectionalityBonus: number;
  ShapeComplexity: number;
  MemoryMultiplier: number;
  AdjustedPayout: number;
}

export default function Home() {
  const [data, setData] = useState<EnhancedPayout[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/payout');
        const json = await res.json();

        if (Array.isArray(json)) {
          setData(json);
        } else if (json.data && Array.isArray(json.data)) {
          setData(json.data);
        } else {
          console.error('Unexpected data format:', json);
        }
      } catch (err) {
        console.error('Failed to fetch payout data:', err);
      }
    }

    fetchData();
  }, []);

  const totalPayout = data.reduce((sum, row) => sum + (row.AdjustedPayout || 0), 0);
  const averagePayout = (data.length > 0) ? (totalPayout / data.length).toFixed(2) : '0.00';

  return (
    <main className="px-6 py-10 max-w-5xl mx-auto">
      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-text">
          <h1>Wind and Hail Risk<br />Reimagined for Engineers</h1>
          <p>Calculated. Visualized. Transparent.</p>
          <p>Using real spatial data to assess storm impact probability and insurance payout modeling.</p>
          <a href="#final-answer">
            <button>View Final Answer</button>
          </a>
        </div>
        <div className="hero-image">
          <Image src="/hero.png" alt="Engineers smiling" width={500} height={400} />
        </div>
      </section>

      {/* FINAL ANSWER SECTION */}
      <section id="final-answer" className="mt-16">
        <h2 className="text-2xl font-semibold mb-2">A. Final Answer</h2>
        <p className="text-lg mb-6">
          This table represents the enhanced payout results using spatial hail event data and advanced proximity modeling.
        </p>

        <h2 className="payout-title">📊 Payout Results Overview</h2>

        <div className="payout-table-wrapper overflow-x-auto">
          <table className="payout-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Direct Hit</th>
                <th>Distance to Property (m)</th>
                <th>Area Multiplier</th>
                <th>Directionality Bonus</th>
                <th>Shape Complexity</th>
                <th>Memory Multiplier</th>
                <th>Adjusted Payout ($)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => {
                const payoutValue = parseFloat(row.AdjustedPayout?.toString() ?? '0');
                const isPayout = payoutValue > 0;
                const isHit = row.Hit === true;

                return (
                  <tr key={row.Year || index}>
                    <td>{row.Year.replace('hail_', '')}</td>
                    <td className={isHit ? 'green' : 'red'}>{isHit ? 'True' : 'False'}</td>
                    <td>{row.Distance_m !== undefined ? row.Distance_m.toLocaleString() : '—'}</td>
                    <td>{row.AreaMultiplier?.toFixed(2)}</td>
                    <td>{row.DirectionalityBonus?.toFixed(2)}</td>
                    <td>{row.ShapeComplexity?.toFixed(2)}</td>
                    <td>{row.MemoryMultiplier?.toFixed(2)}</td>
                    <td className={isPayout ? 'green' : 'red'}>${payoutValue.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Valatility Analysis Section */}
        <h3 className="text-xl font-semibold mt-8 mb-2">Volatility Analysis</h3>
        <p className="text-base leading-relaxed">
        The standard deviation of annual payouts over the 10-year window is $3,897.41, indicating high volatility in storm impact and payout exposure.
        This places the location in a <strong>High Volatility Tier</strong>, signaling significant year-to-year risk variability.
        </p>

        {/* SUMMARY SECTION */}
        <h3 className="text-xl font-semibold mt-6 mb-2">Summary</h3>
        <p className="text-base mb-2 leading-relaxed">
          This enhanced payout table reflects spatial and temporal risk over a ten year window. Each row represents a year of storm data evaluated against multiple modifiers.
        </p>
        <ul className="list-disc list-inside text-base mb-4">
          <li>Hit marks a direct impact from a storm polygon</li>
          <li>Distance shows how close each storm came</li>
          <li>Area Multiplier reflects how large the storm polygon was</li>
          <li>Directionality Bonus rewards storms approaching from the main historical threat vector</li>
          <li>Shape Complexity represents irregularity in storm boundary</li>
          <li>Memory Multiplier accounts for prior years with similar near-miss behavior</li>
        </ul>
        <p className="text-lg font-semibold">
          Expected annual payout across all years: <span className="text-green-600">${averagePayout}</span>
        </p>
      </section>

      {/* METHODOLOGY */}
      <section id="methodology" className="mt-16">
        <h2 className="text-2xl font-semibold">B. Methodology</h2>
      <ul className="list-disc list-inside">
        <li>Parsed 10 years of verified hail event GeoJSON data</li>
        <li>Insured location defined as a fixed coordinate</li>
        <li>Used Shapely to check for direct hit containment and shortest distances</li>
        <li>Defined near-miss threshold at 2000 meters</li>
        <li>Developed edge-weighted payout model with modifiers including area, directionality, shape, and memory zone proximity</li>
        <li>Calculated annual adjusted payout based on spatial and behavioral indicators</li>
        <li>Computed expected annual payout using 10-year average</li>
        <li>Calculated standard deviation of yearly payouts to measure volatility and assigned a volatility tier (Low, Moderate, High)</li>
        <li>Built TypeScript API to serve JSON data to Next frontend</li>
      </ul>
    </section>

      {/* CODE WALKTHROUGH */}
      <section id="code" className="mt-16">
        <h2 className="text-2xl font-semibold">C. Code Walkthrough</h2>
        <p className="mb-2">
          The modeling and front end integration relies on the following files:
        </p>
        <ul className="list-disc list-inside">
          <li><strong>analyzer.py</strong> – Initial binary hit or miss model for direct polygon containment</li>
          <li><strong>enhanced_analyzer.py</strong> – Final enhanced payout logic with modifiers and spatial decay</li>
          <li><strong>debug_distance.py</strong> – Logs edge distances for near-miss diagnostics and transparency</li>
          <li><strong>convert.js</strong> – Transforms CSV to usable JSON format for frontend display</li>
          <li><strong>app/page.tsx</strong> – Main landing page with Final Answer, Methodology, Code, and Ideation sections</li>
          <li><strong>app/api/payout/route.ts</strong> – Handles JSON API delivery of model output</li>
          <li><strong>globals.css</strong> – Custom styles to match the product brand</li>
        </ul>
        <p className="mt-2">
          <Link
            href="https://github.com/flyingrobo12/sola-hail-site"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            View code on GitHub →
          </Link>
        </p>
      </section>

      {/* IDEATION SECTION */}
      <section id="ideation" className="mt-16">
        <h2 className="text-2xl font-semibold">D. Ideation Process</h2>
        <p>
          This project began with a simple hit or miss logic using shapefile containment. But real storms do not follow binary logic. 
          I realized that storms that came close still posed serious risk, even if they just barely missed the insured property.
        </p>
        <p className="mt-4">
          I built a spatial buffer and edge detection system. From there I layered in area, direction, memory, and shape analytics 
          to make the payouts smarter. It became a multi-dimensional risk model that reflects what real damage likelihood looks like over time.
        </p>
        <p className="mt-4">
          If given more time, I would have integrated NOAA-level intensity data and built a full simulation dashboard with policy toggles.
          The current model is scalable and transparent by design.
        </p>
      </section>
    </main>
  );
}
