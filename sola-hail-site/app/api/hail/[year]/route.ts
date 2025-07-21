import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises'; // using promises API

export async function GET(
  req: Request,
  { params }: { params: { year: string } }
) {
  const { year } = params;

  const filePath = path.join(
    process.cwd(),
    'data',
    'hail_maps',
    `hail_${year}.geojson`
  );

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return NextResponse.json(data);
  } catch (error) {
    console.error('GeoJSON error:', error);
    return NextResponse.json(
      { error: `Failed to load hail data for year ${year}` },
      { status: 500 }
    );
  }
}

