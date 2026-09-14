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
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = require("./lib/prisma");
const autoPublisher_1 = require("./lib/autoPublisher");
dotenv_1.default.config();
const PORT = process.env.PORT || 5000;
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, prisma_1.verifyDbConnection)();
        }
        catch (e) {
            console.error("❌ Supabase database connection failed:", e);
            process.exit(1);
        }
        app_1.default.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
        // Start background auto-publisher that will publish courses left in REVIEW for 24+ hours
        try {
            (0, autoPublisher_1.startAutoPublisher)();
        }
        catch (err) {
            console.error('Failed to start auto-publisher:', err);
        }
        // Run a non-blocking CourseProgress consistency backfill on startup.
        // This will fill missing `lessonProgress` arrays when modules are present but empty.
        try {
            // Import lazily to avoid startup ordering issues
            const cpService = yield Promise.resolve().then(() => __importStar(require('./services/courseProgressService')));
            cpService.backfillMissingLessonProgress().then((res) => {
                console.log('CourseProgress backfill completed:', res);
            }).catch((e) => {
                console.error('CourseProgress backfill failed:', e);
            });
        }
        catch (e) {
            console.error('Failed to schedule CourseProgress backfill:', e);
        }
    });
}
start();
