import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

type YearlyPayout = {
  Year: number;
  Hit: boolean;
  DistanceToPolygon: number;
  NumPolygons: number;
  TotalArea: number;
  NearMiss: boolean;
  AdjustedPayout: number;
};

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'annual_payouts.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const parsed: YearlyPayout[] = JSON.parse(fileContent);

    return NextResponse.json(parsed);
  } catch (err: unknown) {
  if (err instanceof Error) {
    console.error('Failed to load payout data:', err.message);
  } else {
    console.error('Failed to load payout data:', err);
  }
  return new NextResponse('Error loading payout data', { status: 500 });
}

}
