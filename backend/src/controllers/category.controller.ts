import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// Get full list of categories (as documents)
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    res.json(categories.map((category) => ({ ...category, _id: category.id })));
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    const newCategory = await prisma.category.create({ data: { name } });
    res.status(201).json({ message: "Category created", category: { ...newCategory, _id: newCategory.id } });
  } catch (error) {
    console.error("Failed to create category:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    try {
      const updatedCategory = await prisma.category.update({ where: { id }, data: { name } });
      res.json({ message: "Category updated", category: { ...updatedCategory, _id: updatedCategory.id } });
    } catch (e) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
  } catch (error) {
    console.error("Failed to update category:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    try {
      await prisma.category.delete({ where: { id } });
      res.json({ message: "Category deleted" });
    } catch (e) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
  } catch (error) {
    console.error("Failed to delete category:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
};
