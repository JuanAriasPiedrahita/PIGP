import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, codigo, nombre FROM zonas ORDER BY codigo ASC"
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
    const { codigo, nombre } = body;
    if (!codigo || !/^[0-9]{2}$/.test(codigo)) {
      return NextResponse.json({ error: "El código de zona debe tener exactamente 2 dígitos (ej: 01)." }, { status: 400 });
    }
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO zonas (codigo, nombre) VALUES (?, ?)",
      [codigo, nombre || null]
    );
    return NextResponse.json({ id: result.insertId, codigo, nombre }, { status: 201 });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
