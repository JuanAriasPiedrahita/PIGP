import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, descripcion FROM comunas ORDER BY descripcion ASC"
    );
    return NextResponse.json(rows);
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { descripcion } = body;
    if (!descripcion) {
      return NextResponse.json({ error: "La descripción de la comuna es obligatoria." }, { status: 400 });
    }
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO comunas (descripcion) VALUES (?)",
      [descripcion]
    );
    return NextResponse.json({ id: result.insertId, descripcion }, { status: 201 });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
