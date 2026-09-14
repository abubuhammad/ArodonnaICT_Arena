// backend/src/routes/category.routes.ts
import express from "express";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../controllers/category.controller";
import { authenticateAdmin } from "../middlewares/auth";

const router = express.Router();

router.get("/", getCategories);
router.post("/", authenticateAdmin, createCategory);
router.put("/:id", authenticateAdmin, updateCategory);
router.delete("/:id", authenticateAdmin, deleteCategory);

export default router;
