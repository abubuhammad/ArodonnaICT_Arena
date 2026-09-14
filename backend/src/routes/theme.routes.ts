// backend/src/routes/theme.routes.ts
import express from "express";
import { getTheme, updateTheme } from "../controllers/theme.controller";
import { authenticateAdmin } from "../middlewares/auth";

const router = express.Router();

router.get("/", getTheme);
router.put("/:id", authenticateAdmin, updateTheme);

export default router;
