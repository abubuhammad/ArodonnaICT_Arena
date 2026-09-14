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
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategories = void 0;
const prisma_1 = require("../lib/prisma");
// Get full list of categories (as documents)
const getCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield prisma_1.prisma.category.findMany({ orderBy: { name: "asc" } });
        res.json(categories.map((category) => (Object.assign(Object.assign({}, category), { _id: category.id }))));
    }
    catch (error) {
        console.error("Failed to fetch categories:", error);
        res.status(500).json({ error: "Failed to fetch categories" });
    }
});
exports.getCategories = getCategories;
const createCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name } = req.body;
        const newCategory = yield prisma_1.prisma.category.create({ data: { name } });
        res.status(201).json({ message: "Category created", category: Object.assign(Object.assign({}, newCategory), { _id: newCategory.id }) });
    }
    catch (error) {
        console.error("Failed to create category:", error);
        res.status(500).json({ error: "Failed to create category" });
    }
});
exports.createCategory = createCategory;
const updateCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name } = req.body;
        try {
            const updatedCategory = yield prisma_1.prisma.category.update({ where: { id }, data: { name } });
            res.json({ message: "Category updated", category: Object.assign(Object.assign({}, updatedCategory), { _id: updatedCategory.id }) });
        }
        catch (e) {
            res.status(404).json({ error: "Category not found" });
            return;
        }
    }
    catch (error) {
        console.error("Failed to update category:", error);
        res.status(500).json({ error: "Failed to update category" });
    }
});
exports.updateCategory = updateCategory;
const deleteCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        try {
            yield prisma_1.prisma.category.delete({ where: { id } });
            res.json({ message: "Category deleted" });
        }
        catch (e) {
            res.status(404).json({ error: "Category not found" });
            return;
        }
    }
    catch (error) {
        console.error("Failed to delete category:", error);
        res.status(500).json({ error: "Failed to delete category" });
    }
});
exports.deleteCategory = deleteCategory;
