'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import HailMap from './components/hailmap';

interface YearlyPayout {
  Year: string;
  Hit: string;
  DistanceToPolygon_m: string;
  NumPolygons: string;
  TotalArea_km2: string;
  NearMiss: string;
  AdjustedPayout: string;
}

export default function Home() {
  const [data, setData] = useState<YearlyPayout[]>([]);
  const [summaryRaw, setSummaryRaw] = useState<string>('');
  const [summary, setSummary] = useState<any>({});

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/payout', { cache: 'no-store' });
        const json = await res.json();

        if (Array.isArray(json)) {
          setData(json);
        } else if (json.data && Array.isArray(json.data)) {
          setData(json.data);
        } else {
          console.error('Unexpected data format:', json);
        }

        if (json.summary) {
          setSummaryRaw(json.summary);
          try {
            const parsed = typeof json.summary === 'string' ? JSON.parse(json.summary) : json.summary;
            setSummary(parsed);
          } catch (e) {
            console.error('Failed to parse summary JSON:', e);
          }
        }
      } catch (err) {
        console.error('Failed to fetch payout data:', err);
      }
    }

    fetchData();
  }, []);

  return (
    <main className="px-6 py-10 max-w-5xl mx-auto">
      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-text">
          <h1>Wind and Hail Risk,<br />Reimagined for Engineers</h1>
          <p>Calculated. Visualized. Transparent.</p>
          <p>Using real spatial data to assess storm impact probability and insurance payout modeling.</p>
          <a href="#final-answer">
            <button>View Final Answer</button>
          </a>
        </div>
        <div className="hero-image">
          <img src="/hero.png" alt="Engineers smiling" />
        </div>
      </section>

{/* FINAL ANSWER */}
<section id="final-answer" className="mt-16">
  <h2 className="text-2xl font-semibold mb-2">A. Final Answer</h2>
  <p className="text-lg mb-6">
    This table represents the calculated payout results using spatial hail event data and proximity logic.
  </p>

  <h2 className="payout-title">📊 Payout Results Overview</h2>

  <div className="payout-table-wrapper">
    <table className="payout-table">
      <thead>
        <tr>
          <th>Year</th>
          <th>Hit</th>
          <th>Distance (m)</th>
          <th># Polygons</th>
          <th>Total Area (km²)</th>
          <th>Near Miss</th>
          <th>Adjusted Payout ($)</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row) => {
          const payoutValue = parseFloat(row.AdjustedPayout ?? '0');
          const isPayout = payoutValue > 0;
          const isHit = row.Hit?.toLowerCase?.() === 'true';
          const isNearMiss = row.NearMiss?.toLowerCase?.() === 'true';
          return (
            <tr key={row.Year}>
              <td>{row.Year}</td>
              <td className={isHit ? 'green' : 'red'}>{row.Hit}</td>
              <td>{parseFloat(row.DistanceToPolygon_m).toLocaleString()}</td>
              <td>{row.NumPolygons}</td>
              <td>{parseFloat(row.TotalArea_km2).toLocaleString()}</td>
              <td className={isNearMiss ? 'green' : 'red'}>{row.NearMiss}</td>
              <td className={isPayout ? 'green' : 'red'}>
                ${payoutValue.toLocaleString()}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>

  <h3 className="text-xl font-semibold mt-6 mb-2">Summary</h3>
  <p className="text-base mb-4 leading-relaxed">
    Over the course of the past decade, this analysis models the expected insurance liability from hail events
    using historical geospatial polygon data and custom proximity-based logic. One year triggered a direct payout,
    and one additional year qualified as a near miss under a 2,000-meter threshold. These conditions informed an
    <strong> expected annual payout</strong> estimation and a <strong>total adjusted payout</strong> projection. If
    similar event frequency continues, this data-driven model suggests that Sola Insurance should expect comparable
    annual liability moving forward under current risk assumptions and geographic parameters.
  </p>

</section>



      {/* METHODOLOGY */}
      <section id="methodology" className="mt-16">
        <h2 className="text-2xl font-semibold">B. Methodology</h2>
        <ul className="list-disc list-inside">
          <li>Ingested 10 years of storm polygon data from annual GeoJSON files, each representing verified hail events.</li>
          <li>Parsed and structured each year’s GeoJSON into a usable format for spatial analysis.</li>
          <li>Defined the insured location as a fixed point and used the Shapely geometry library to determine whether that point was contained within any of the hailstorm polygons for that year.</li>
          <li>For years without a direct polygon hit, computed the shortest distance in meters between the insured point and each polygon using Shapely's .distance() method.</li>
          <li>Identified "near-miss" events as those within a 2,000-meter threshold from the insured location, reflecting plausible exposure to nearby storm activity.</li>
          <li>Classified storm events into binary Hit and Near Miss categories to enable payout logic.</li>
          <li>Developed a probability-weighted payout model, where: Direct hits triggered full payout. Near misses received partial payouts scaled by proximity (e.g. 75% for within 500m, 50% for 500–1,000m, 25% for 1,000–2,000m).</li>
          <li>Aggregated adjusted payouts year over year and calculated a 10-year average to model long-term expected liability.</li>
          <li>Returned the structured results via a TypeScript API (/api/payout) and dynamically rendered a table with hit/miss status, proximity, polygon count, area, and final payout estimates.</li>
        </ul>
      </section>

      {/* CODE WALK-THROUGH */}
      <section id="code" className="mt-16">
        <h2 className="text-2xl font-semibold">C. Code Walk-Through</h2>
        <p>The code is structured across four main Python scripts in the <code>/src</code> folder:</p>
        <ul className="list-disc list-inside">
          <li><strong>analyzer.py</strong> — Core payout and event logic</li>
          <li><strong>spatial_utils.py</strong> — Geo calculations</li>
          <li><strong>debug_distance.py</strong> — Logs near-miss distances</li>
          <li><strong>test_containment.py</strong> — Unit test coverage</li>
          <li className="mt-4"><strong>app/page.tsx</strong> — Landing page showing the Final Answer summary</li>
          <li><strong>app/payout/page.tsx</strong> — Displays annual event payout table</li>
          <li><strong>app/methodology/page.tsx</strong> — Step-by-step technical overview of the data processing</li>
          <li><strong>components/PayoutTable.tsx</strong> — Reusable component to render payout tables</li>
          <li><strong>styles/global.css</strong> — Custom styling matching Sola Insurance brand</li>
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

      {/* IDEATION PROCESS */}
      <section id="ideation" className="mt-16">
  <h2 className="text-2xl font-semibold">D. Ideation Process</h2>
  <p>
    I began this project thinking in terms of binary outcomes, but that felt too simplistic for how risk works in the real world.
    As I explored the data more deeply, I noticed that some storms came close, but just barely missed. These near-misses weren’t random. They represented real risk exposure that traditional binary payout models completely ignore.
  </p>
  <p className="mt-4">
    That’s when I reimagined the payout structure using a distance-weighted logic. I categorized storm misses into proximity tiers and assigned them predictive value. This let the model reflect risk that builds gradually. 
    I treated these tiers as probabilistic indicators of loss potential over time. This gave the model a more nuanced understanding of exposure across a decade of data.
  </p>
  <p className="mt-4">
    With more time, I would have expanded the model to include: dynamic risk simulations, visual overlays of historical storm paths, and an interactive dashboard for users to explore year-by-year risk trends. 
    I also would have explored layering in meteorological data such as hail size, wind speeds, or NOAA-issued warnings to improve accuracy. 
  </p>
</section>

    </main>
  );
}
