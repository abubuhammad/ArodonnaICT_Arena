import { Request, Response } from "express";

// Returns list of tenants for admin UI. For now, reads from env var `TENANTS_JSON` (JSON array),
// otherwise returns a single default tenant entry for local dev.
export const listTenants = async (req: Request, res: Response): Promise<void> => {
  try {
    const raw = process.env.TENANTS_JSON;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          res.json(parsed);
          return;
        }
      } catch (err) {
        // fallthrough
      }
    }

    // Fallback sample tenants for local development
    res.json([
      { id: "__all", name: "All tenants" },
      { id: "tenant_1", name: "Acme University" },
      { id: "tenant_2", name: "Partner Co" },
    ]);
  } catch (err: any) {
    console.error("Error listing tenants:", err);
    res.status(500).json({ error: "Failed to list tenants" });
  }
};
