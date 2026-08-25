import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET(req: NextRequest) {
  try {
    const comunaId = req.nextUrl.searchParams.get("comuna_id");
    let sql = "SELECT id, comuna_id, nombre FROM barrios";
    const args: (string | number)[] = [];
    if (comunaId) {
      sql += " WHERE comuna_id = ?";
      args.push(comunaId);
    }
    sql += " ORDER BY nombre ASC";
    const [rows] = await pool.query<RowDataPacket[]>(sql, args);
    return NextResponse.json(rows);
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { comuna_id, nombre } = body;
    if (!comuna_id || !nombre) {
      return NextResponse.json({ error: "Comuna y nombre del barrio son obligatorios." }, { status: 400 });
    }
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO barrios (comuna_id, nombre) VALUES (?, ?)",
      [comuna_id, nombre]
    );
    return NextResponse.json({ id: result.insertId, comuna_id, nombre }, { status: 201 });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
