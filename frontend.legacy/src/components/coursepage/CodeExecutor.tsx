import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface CodeExecutorProps {
  language: string;
  initialCode?: string;
  onClose: () => void;
}

const CodeExecutor: React.FC<CodeExecutorProps> = ({ language, initialCode = '', onClose }) => {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRunCode = async () => {
    setIsLoading(true);
    setError('');
    setOutput('');

    try {
      const response = await fetch('/api/code/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute code');
      }

      setOutput(data.output);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg w-[90vw] h-[90vh] flex flex-col"
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Code Editor</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4 p-4">
          <div className="border rounded-lg overflow-hidden">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-full p-4 font-mono text-sm bg-gray-900 text-white resize-none focus:outline-none"
              placeholder="Write your code here..."
            />
          </div>

          <div className="border rounded-lg p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Output</h3>
              <button
                onClick={handleRunCode}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
              >
                {isLoading ? 'Running...' : 'Run Code'}
              </button>
            </div>

            <div className="flex-1 bg-gray-100 rounded p-4 overflow-auto">
              {error ? (
                <div className="text-red-500">{error}</div>
              ) : (
                <pre className="whitespace-pre-wrap">{output}</pre>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CodeExecutor; 