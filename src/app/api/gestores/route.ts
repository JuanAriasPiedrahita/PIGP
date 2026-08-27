import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { isValidEmail } from "@/lib/validations";

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, nombre, email FROM gestores ORDER BY nombre ASC"
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
    const nombre = String(body.nombre || "").trim();
    const email = String(body.email || "").trim();
    if (!nombre) {
      return NextResponse.json({ error: "El nombre del gestor es obligatorio" }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO gestores (nombre, email) VALUES (?, ?)",
      [nombre, email || null]
    );
    return NextResponse.json({ id: result.insertId, nombre, email: email || null }, { status: 201 });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
