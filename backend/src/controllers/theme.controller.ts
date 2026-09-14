// backend/src/controllers/theme.controller.ts
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

/**
 * Get the active theme configuration.
 */
export const getTheme = async (req: Request, res: Response): Promise<void> => {
  try {
    let theme = await prisma.theme.findFirst({ where: { active: true } });
    if (!theme) {
      // Create and set default theme if none exists
      theme = await prisma.theme.create({
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
  } catch (error) {
    console.error("Failed to fetch theme:", error);
    res.status(500).json({ error: "Failed to fetch theme" });
  }
};

/**
 * Update the theme configuration.
 * Only admins should be allowed to call this endpoint.
 */
export const updateTheme = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // If setting this theme as active, deactivate all other themes
    if (updateData.active) {
      await prisma.theme.updateMany({ where: { id: { not: id }, active: true }, data: { active: false } });
    }

    const updatedTheme = await prisma.theme.update({
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
  } catch (error) {
    console.error("Failed to update theme:", error);
    res.status(500).json({ error: "Failed to update theme" });
  }
};
