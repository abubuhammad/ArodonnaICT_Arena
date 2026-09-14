"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/theme.routes.ts
const express_1 = __importDefault(require("express"));
const theme_controller_1 = require("../controllers/theme.controller");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router.get("/", theme_controller_1.getTheme);
router.put("/:id", auth_1.authenticateAdmin, theme_controller_1.updateTheme);
exports.default = router;
