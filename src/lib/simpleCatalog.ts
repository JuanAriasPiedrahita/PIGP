import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

/**
 * Fábrica de handlers CRUD para catálogos simples de una sola columna
 * (id + descripcion): profesiones, ocupaciones, parentescos, dependencias.
 * Los nombres de tabla están controlados internamente (no vienen del usuario),
 * por lo que interpolarlos en el SQL es seguro.
 */
export function simpleCatalogHandlers(table: "profesiones" | "ocupaciones" | "parentescos" | "dependencias") {
  async function list() {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT id, descripcion FROM ${table} ORDER BY descripcion ASC`
      );
      return NextResponse.json(rows);
    } catch (err) {
      const { message, status } = friendlyDbError(err);
      return NextResponse.json({ error: message }, { status });
    }
  }

  async function create(req: NextRequest) {
    try {
      const body = await req.json();
      const { descripcion } = body;
      if (!descripcion || !String(descripcion).trim()) {
        return NextResponse.json({ error: "La descripción es obligatoria." }, { status: 400 });
      }
      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO ${table} (descripcion) VALUES (?)`,
        [String(descripcion).trim()]
      );
      return NextResponse.json({ id: result.insertId, descripcion: String(descripcion).trim() }, { status: 201 });
    } catch (err) {
      const { message, status } = friendlyDbError(err);
      return NextResponse.json({ error: message }, { status });
    }
  }

  async function update(req: NextRequest, id: string) {
    try {
      const body = await req.json();
      const { descripcion } = body;
      if (!descripcion || !String(descripcion).trim()) {
        return NextResponse.json({ error: "La descripción es obligatoria." }, { status: 400 });
      }
      await pool.query(`UPDATE ${table} SET descripcion = ? WHERE id = ?`, [String(descripcion).trim(), id]);
      return NextResponse.json({ id: Number(id), descripcion: String(descripcion).trim() });
    } catch (err) {
      const { message, status } = friendlyDbError(err);
      return NextResponse.json({ error: message }, { status });
    }
  }

  async function remove(id: string) {
    try {
      await pool.query(`DELETE FROM ${table} WHERE id = ?`, [id]);
      return NextResponse.json({ ok: true });
    } catch (err) {
      const { message, status } = friendlyDbError(err);
      return NextResponse.json({ error: message }, { status });
    }
  }

  return { list, create, update, remove };
}
