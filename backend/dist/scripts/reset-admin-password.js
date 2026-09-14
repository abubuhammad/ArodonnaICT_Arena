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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const email = ((_a = process.argv[2]) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase()) || "admin@example.com";
function readHidden(prompt) {
    return new Promise((resolve) => {
        var _a;
        const input = process.stdin;
        const output = process.stdout;
        let value = "";
        output.write(prompt);
        (_a = input.setRawMode) === null || _a === void 0 ? void 0 : _a.call(input, true);
        input.resume();
        input.setEncoding("utf8");
        const onData = (chunk) => {
            var _a, _b, _c, _d;
            for (const character of chunk) {
                if (character === "\u0003") {
                    (_a = input.setRawMode) === null || _a === void 0 ? void 0 : _a.call(input, false);
                    input.pause();
                    process.exit(130);
                }
                if (character === "\r" || character === "\n") {
                    (_b = input.setRawMode) === null || _b === void 0 ? void 0 : _b.call(input, false);
                    input.pause();
                    input.removeListener("data", onData);
                    output.write("\n");
                    resolve(value);
                    return;
                }
                if (character === "\u007f") {
                    value = value.slice(0, -1);
                    (_c = output.clearLine) === null || _c === void 0 ? void 0 : _c.call(output, 0);
                    (_d = output.cursorTo) === null || _d === void 0 ? void 0 : _d.call(output, 0);
                    output.write(`${prompt}${"*".repeat(value.length)}`);
                }
                else {
                    value += character;
                    output.write("*");
                }
            }
        };
        input.on("data", onData);
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const password = yield readHidden(`New password for ${email}: `);
        if (!password)
            throw new Error("Password cannot be empty");
        const admin = yield prisma.user.findFirst({ where: { email, role: "ADMIN" } });
        if (!admin)
            throw new Error(`No ADMIN account found for ${email}`);
        yield prisma.user.update({
            where: { id: admin.id },
            data: { password: yield bcryptjs_1.default.hash(password, 10) }
        });
        console.log(`Password reset for ${email}`);
    });
}
main()
    .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
})
    .finally(() => prisma.$disconnect());
