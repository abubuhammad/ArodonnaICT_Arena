import express, { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '../middleware/auth';

const execAsync = promisify(exec);
const router = express.Router();

type SupportedLanguage = 'python' | 'javascript' | 'typescript' | 'html' | 'css';

// Supported languages and their file extensions
const SUPPORTED_LANGUAGES: Record<SupportedLanguage, string> = {
  python: 'py',
  javascript: 'js',
  typescript: 'ts',
  html: 'html',
  css: 'css',
};

// Create a temporary directory for code execution
const TEMP_DIR = path.join(__dirname, '../../temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

interface CodeExecutionRequest {
  code: string;
  language: SupportedLanguage;
}

router.post('/execute', auth, async (req: Request<{}, {}, CodeExecutionRequest>, res: Response): Promise<void> => {
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
    const filename = `${uuidv4()}.${SUPPORTED_LANGUAGES[language]}`;
    const filepath = path.join(TEMP_DIR, filename);

    // Write the code to a temporary file
    fs.writeFileSync(filepath, code);

    let command: string | undefined;
    let output: string | undefined;

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
        await execAsync(`tsc ${filepath}`);
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
      const { stdout, stderr } = await execAsync(command);
      output = stdout || stderr;
    }

    // Clean up temporary files
    fs.unlinkSync(filepath);
    if (language === 'typescript') {
      fs.unlinkSync(filepath.replace('.ts', '.js'));
    }

    res.json({ output });
  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({ error: 'Failed to execute code' });
  }
});

export default router; 