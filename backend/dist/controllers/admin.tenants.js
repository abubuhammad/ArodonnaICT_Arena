"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTenants = void 0;
// Returns list of tenants for admin UI. For now, reads from env var `TENANTS_JSON` (JSON array),
// otherwise returns a single default tenant entry for local dev.
const listTenants = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const raw = process.env.TENANTS_JSON;
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    res.json(parsed);
                    return;
                }
            }
            catch (err) {
                // fallthrough
            }
        }
        // Fallback sample tenants for local development
        res.json([
            { id: "__all", name: "All tenants" },
            { id: "tenant_1", name: "Acme University" },
            { id: "tenant_2", name: "Partner Co" },
        ]);
    }
    catch (err) {
        console.error("Error listing tenants:", err);
        res.status(500).json({ error: "Failed to list tenants" });
    }
});
exports.listTenants = listTenants;
