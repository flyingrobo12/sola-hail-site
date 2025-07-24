import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface PayoutEntry {
  year: number;
  direct_hit: boolean;
  distance_m: number;
  area_multiplier: number;
  directionality_bonus: number;
  shape_complexity: number;
  memory_zone_multiplier: number;
  payout: number;
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'app/api/payout/enhanced_payouts.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const parsed: PayoutEntry[] = JSON.parse(fileContent);

    const cleaned = parsed.map((entry) => ({
      Year: entry.year,
      Hit: entry.direct_hit,
      Distance_m: entry.distance_m,
      AreaMultiplier: entry.area_multiplier,
      DirectionalityBonus: entry.directionality_bonus,
      ShapeComplexity: entry.shape_complexity,
      MemoryMultiplier: entry.memory_zone_multiplier,
      AdjustedPayout: entry.payout
    }));

    return NextResponse.json(cleaned);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Failed to load payout data:', err.message);
    } else {
      console.error('Failed to load payout data:', err);
    }
    return new NextResponse('Error loading payout data', { status: 500 });
  }
}
