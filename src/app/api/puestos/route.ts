import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET(req: NextRequest) {
  try {
    const zonaId = req.nextUrl.searchParams.get("zona_id");
    let sql = "SELECT id, zona_id, numero, nombre, direccion, num_mesas FROM puestos";
    const args: (string | number)[] = [];
    if (zonaId) {
      sql += " WHERE zona_id = ?";
      args.push(zonaId);
    }
    sql += " ORDER BY numero ASC";
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
    const { zona_id, numero, nombre, direccion, num_mesas } = body;
    if (!zona_id || !numero || !/^[0-9]{2}$/.test(numero) || !nombre) {
      return NextResponse.json({ error: "Zona, número de puesto (2 dígitos) y nombre son obligatorios." }, { status: 400 });
    }
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO puestos (zona_id, numero, nombre, direccion, num_mesas) VALUES (?, ?, ?, ?, ?)",
      [zona_id, numero, nombre, direccion || null, num_mesas || 1]
    );
    return NextResponse.json({ id: result.insertId, zona_id, numero, nombre, direccion: direccion || null, num_mesas }, { status: 201 });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
