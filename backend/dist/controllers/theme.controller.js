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
exports.updateTheme = exports.getTheme = void 0;
const prisma_1 = require("../lib/prisma");
/**
 * Get the active theme configuration.
 */
const getTheme = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let theme = yield prisma_1.prisma.theme.findFirst({ where: { active: true } });
        if (!theme) {
            // Create and set default theme if none exists
            theme = yield prisma_1.prisma.theme.create({
                data: {
                    name: "Default",
                    primaryColor: "#4F46E5",
                    secondaryColor: "#A5B4FC",
                    backgroundGradient: "linear-gradient(to right, #4F46E5, #A5B4FC)",
                    fontFamily: "sans-serif",
                    active: true
                }
            });
        }
        res.json(theme);
    }
    catch (error) {
        console.error("Failed to fetch theme:", error);
        res.status(500).json({ error: "Failed to fetch theme" });
    }
});
exports.getTheme = getTheme;
/**
 * Update the theme configuration.
 * Only admins should be allowed to call this endpoint.
 */
const updateTheme = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // If setting this theme as active, deactivate all other themes
        if (updateData.active) {
            yield prisma_1.prisma.theme.updateMany({ where: { id: { not: id }, active: true }, data: { active: false } });
        }
        const updatedTheme = yield prisma_1.prisma.theme.update({
            where: { id },
            data: {
                name: updateData.name,
                primaryColor: updateData.primaryColor,
                secondaryColor: updateData.secondaryColor,
                backgroundGradient: updateData.backgroundGradient,
                fontFamily: updateData.fontFamily,
                active: updateData.active
            }
        });
        res.json({ message: "Theme updated successfully", theme: updatedTheme });
    }
    catch (error) {
        console.error("Failed to update theme:", error);
        res.status(500).json({ error: "Failed to update theme" });
    }
});
exports.updateTheme = updateTheme;
