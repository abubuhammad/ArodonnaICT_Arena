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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const auth_1 = require("../middleware/auth");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const router = express_1.default.Router();
// Supported languages and their file extensions
const SUPPORTED_LANGUAGES = {
    python: 'py',
    javascript: 'js',
    typescript: 'ts',
    html: 'html',
    css: 'css',
};
// Create a temporary directory for code execution
const TEMP_DIR = path_1.default.join(__dirname, '../../temp');
if (!fs_1.default.existsSync(TEMP_DIR)) {
    fs_1.default.mkdirSync(TEMP_DIR);
}
router.post('/execute', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code, language } = req.body;
        if (!code || !language) {
            res.status(400).json({ error: 'Code and language are required' });
            return;
        }
        if (!SUPPORTED_LANGUAGES[language]) {
            res.status(400).json({ error: 'Unsupported programming language' });
            return;
        }
        // Create a unique filename for this execution
        const filename = `${(0, uuid_1.v4)()}.${SUPPORTED_LANGUAGES[language]}`;
        const filepath = path_1.default.join(TEMP_DIR, filename);
        // Write the code to a temporary file
        fs_1.default.writeFileSync(filepath, code);
        let command;
        let output;
        // Execute the code based on the language
        switch (language) {
            case 'python':
                command = `python ${filepath}`;
                break;
            case 'javascript':
                command = `node ${filepath}`;
                break;
            case 'typescript':
                // First compile TypeScript
                yield execAsync(`tsc ${filepath}`);
                // Then run the compiled JavaScript
                command = `node ${filepath.replace('.ts', '.js')}`;
                break;
            case 'html':
                // For HTML, we'll return the code as is
                output = code;
                break;
            case 'css':
                // For CSS, we'll return the code as is
                output = code;
                break;
            default:
                throw new Error('Unsupported language');
        }
        if (command) {
            const { stdout, stderr } = yield execAsync(command);
            output = stdout || stderr;
        }
        // Clean up temporary files
        fs_1.default.unlinkSync(filepath);
        if (language === 'typescript') {
            fs_1.default.unlinkSync(filepath.replace('.ts', '.js'));
        }
        res.json({ output });
    }
    catch (error) {
        console.error('Code execution error:', error);
        res.status(500).json({ error: 'Failed to execute code' });
    }
}));
exports.default = router;
