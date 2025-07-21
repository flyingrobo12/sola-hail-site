'use client';

import { useEffect, useState } from 'react';

type PayoutRecord = {
  Year: string;
  Hit: string;
  DistanceToPolygon_m: string;
  NumPolygons: string;
  TotalArea_km2: string;
  NearMiss: string;
  AdjustedPayout: string;
};

type SummaryStats = {
  totalYears: number;
  yearsWithPayouts: number;
  expectedAnnualPayout: string;
  yearsWithNearMisses: number;
  nearMissThreshold: number;
  totalAdjustedPayout: string;
};


export default function PayoutPage() {
  const [data, setData] = useState<PayoutRecord[]>([]);
  const [summary, setSummary] = useState<SummaryStats | null>(null);

  useEffect(() => {
    fetch('api/payout')
      .then((res) => res.json())
      .then((json) => {
        // Filter out any summary rows accidentally mixed in
        const cleanData = json.data?.filter((row: PayoutRecord) => row.Year !== 'Summary Statistics');
        setData(cleanData || []);
        setSummary(json.summary || null);
      })
      .catch((err) => {
        console.error('❌ Error fetching payout data:', err);
      });
  }, []);

  return (
    <div className="payout-container">
      <h1 className="payout-title">📊 Payout Results Overview</h1>

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

      {summary && (
        <div className="summary-box mt-10">
          <h2 className="text-xl font-semibold mb-2">📄 Summary Statistics</h2>
          <table className="summary-table">
            <tbody>
              {[
                ['Total Years Analyzed', summary.totalYears],
                ['Years with Payouts', summary.yearsWithPayouts],
                ['Expected Annual Payout', summary.expectedAnnualPayout],
                ['Years with Near Misses', summary.yearsWithNearMisses],
                ['Near Miss Threshold (m)', summary.nearMissThreshold],
                ['Total Adjusted Payout (with Near Miss Tiers)', summary.totalAdjustedPayout],
              ].map(([label, value]) => (
                <tr key={label as string}>
                  <td>{label}</td>
                  <td className="summary-value">
                    {(value === 'NaN' || value === '$0' || value === 0 || value === null || value === undefined)
                      ? ''
                      : <span className="blue">{value}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
