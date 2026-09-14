"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.refreshToken = exports.adminLogin = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
// ✅ Properly typed user registration function
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, role } = req.body;
        const existingUser = yield prisma_1.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ error: "User already exists" });
            return;
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const roleEnum = (role || 'STUDENT').toString().toUpperCase();
        const created = yield prisma_1.prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: roleEnum === 'INSTRUCTOR' ? 'INSTRUCTOR' : roleEnum === 'ADMIN' ? 'ADMIN' : roleEnum === 'PENDING' ? 'PENDING' : 'STUDENT'
            }
        });
        res.status(201).json({ message: "User registered successfully", user: { id: created.id, name: created.name, email: created.email, role: created.role } });
    }
    catch (error) {
        res.status(500).json({ error: "Registration failed" });
    }
});
exports.register = register;
// ✅ Properly typed user login function
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Login request received:", req.body);
        const { email, password } = req.body;
        if (!email || !password) {
            console.log("Missing email or password");
            res.status(400).json({ error: "Email and password are required" });
            return;
        }
        const user = yield prisma_1.prisma.user.findUnique({ where: { email } });
        console.log("User found:", user ? "Yes" : "No");
        if (!user) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }
        let passwordMatch = yield bcryptjs_1.default.compare(password, user.password);
        console.log("Password match:", passwordMatch ? "Yes" : "No");
        // Legacy fallback: some older users may have plaintext or differently-hashed passwords
        if (!passwordMatch) {
            if (user.password && user.password === password) {
                console.warn("Legacy plaintext password detected. Rehashing now for user:", user.email);
                const newHash = yield bcryptjs_1.default.hash(password, 10);
                yield prisma_1.prisma.user.update({ where: { id: user.id }, data: { password: newHash } });
                passwordMatch = true;
            }
        }
        if (!passwordMatch) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET environment variable is not set");
            res.status(500).json({ error: "Server configuration error" });
            return;
        }
        if (!process.env.JWT_REFRESH_SECRET) {
            console.error("JWT_REFRESH_SECRET environment variable is not set");
            res.status(500).json({ error: "Server configuration error" });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
        const refreshToken = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
        // Set refresh token in cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        console.log("Login successful for user:", user.email);
        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                email: user.email
            }
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});
exports.login = login;
const adminLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const admin = yield prisma_1.prisma.user.findFirst({ where: { email, role: 'ADMIN' } });
        if (!admin) {
            res.status(401).json({ error: "Invalid admin credentials" });
            return;
        }
        // Verify password
        const ok = yield (yield Promise.resolve().then(() => __importStar(require('bcryptjs')))).compare(password, admin.password);
        if (!ok) {
            res.status(401).json({ error: "Invalid admin credentials" });
            return;
        }
        // Sign token with role so middleware can authorize
        const token = jsonwebtoken_1.default.sign({ id: admin.id, role: 'ADMIN' }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const payload = {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
        };
        // Return shape expected by frontend (admin key, plus token)
        res.json({ token, admin: payload, user: payload });
    }
    catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: "Server error" });
    }
});
exports.adminLogin = adminLogin;
const refreshToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Accept refresh token from cookie first, fallback to body
        const tokenFromCookie = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken;
        const tokenFromBody = (req.body && req.body.refreshToken) || null;
        const incomingRefreshToken = tokenFromCookie || tokenFromBody;
        if (!incomingRefreshToken) {
            res.status(400).json({ message: 'Refresh token is required' });
            return;
        }
        // Verify the refresh token
        const decoded = jsonwebtoken_1.default.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
        const user = yield prisma_1.prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Generate new tokens
        const newToken = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const newRefreshToken = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
        res.json({
            token: newToken,
            refreshToken: newRefreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ message: 'Refresh token expired' });
            return;
        }
        res.status(401).json({ message: 'Invalid refresh token' });
        return;
    }
});
exports.refreshToken = refreshToken;
const getCurrentUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        if (!token) {
            res.status(401).json({ error: "No token provided" });
            return;
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const user = yield prisma_1.prisma.user.findUnique({ where: { id: decoded.id } });
            if (!user) {
                res.status(404).json({ error: "User not found" });
                return;
            }
            res.json({
                id: user.id,
                name: user.name,
                role: user.role,
                email: user.email
            });
        }
        catch (error) {
            res.status(401).json({ error: "Invalid token" });
        }
    }
    catch (error) {
        console.error("Error getting current user:", error);
        res.status(500).json({ error: "Failed to get current user" });
    }
});
exports.getCurrentUser = getCurrentUser;
