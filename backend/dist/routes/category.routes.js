"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/category.routes.ts
const express_1 = __importDefault(require("express"));
const category_controller_1 = require("../controllers/category.controller");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router.get("/", category_controller_1.getCategories);
router.post("/", auth_1.authenticateAdmin, category_controller_1.createCategory);
router.put("/:id", auth_1.authenticateAdmin, category_controller_1.updateCategory);
router.delete("/:id", auth_1.authenticateAdmin, category_controller_1.deleteCategory);
exports.default = router;
