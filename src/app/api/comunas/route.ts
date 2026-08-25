import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, codigo, descripcion FROM comunas ORDER BY codigo ASC"
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
    const { codigo, descripcion } = body;
    if (!codigo || !descripcion) {
      return NextResponse.json({ error: "Código y descripción son obligatorios." }, { status: 400 });
    }
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO comunas (codigo, descripcion) VALUES (?, ?)",
      [codigo, descripcion]
    );
    return NextResponse.json({ id: result.insertId, codigo, descripcion }, { status: 201 });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
