import { readFile, writeFile, executeTool } from './agent';
import fs from 'fs/promises';
import path from 'path';

// Mock the fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('Agent Tools', () => {
  const testFilename = 'test.txt';
  const testContent = 'Hello, World!';
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the access method to simulate directory exists
    mockFs.access.mockResolvedValue(undefined);
  });

  describe('readFile', () => {
    it('should read file content successfully', async () => {
      mockFs.readFile.mockResolvedValue(testContent);
      
      const result = await readFile(testFilename);
      
      expect(result).toBe(testContent);
      expect(mockFs.readFile).toHaveBeenCalledWith(
        path.join(process.cwd(), 'files', testFilename),
        'utf-8'
      );
    });

    it('should throw error when file read fails', async () => {
      const errorMessage = 'File not found';
      mockFs.readFile.mockRejectedValue(new Error(errorMessage));
      
      await expect(readFile(testFilename)).rejects.toThrow(
        `Failed to read file ${testFilename}: ${errorMessage}`
      );
    });
  });

  describe('writeFile', () => {
    it('should write file content successfully', async () => {
      mockFs.writeFile.mockResolvedValue(undefined);
      
      await writeFile(testFilename, testContent);
      
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(process.cwd(), 'files', testFilename),
        testContent,
        'utf-8'
      );
    });

    it('should throw error when file write fails', async () => {
      const errorMessage = 'Permission denied';
      mockFs.writeFile.mockRejectedValue(new Error(errorMessage));
      
      await expect(writeFile(testFilename, testContent)).rejects.toThrow(
        `Failed to write file ${testFilename}: ${errorMessage}`
      );
    });
  });

  describe('executeTool', () => {
    it('should execute read_file tool successfully', async () => {
      mockFs.readFile.mockResolvedValue(testContent);
      
      const result = await executeTool({
        name: 'read_file',
        arguments: { filename: testFilename }
      });
      
      expect(result).toBe(`File content: ${testContent}`);
    });

    it('should execute write_file tool successfully', async () => {
      mockFs.writeFile.mockResolvedValue(undefined);
      
      const result = await executeTool({
        name: 'write_file',
        arguments: { filename: testFilename, content: testContent }
      });
      
      expect(result).toBe(`Successfully wrote to file: ${testFilename}`);
    });

    it('should handle unknown tool', async () => {
      const result = await executeTool({
        name: 'unknown_tool',
        arguments: {}
      });
      
      expect(result).toBe('Unknown tool: unknown_tool');
    });
  });
});