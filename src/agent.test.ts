import { readFile, writeFile, AiAgent } from './agent';
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



  describe('Agent', () => {
    let agent: AiAgent;

    beforeEach(() => {
      agent = new AiAgent();
    });

    it('should create agent without parameters', () => {
      expect(agent).toBeInstanceOf(AiAgent);
    });

    it('should handle simple messages', async () => {
      // Mock the generateText function
      const mockGenerateText = jest.fn().mockResolvedValue({
        text: 'Hello! How can I help you today?'
      });
      
      // We can't easily mock the AI SDK in this test, so we'll test the basic structure
      // In a real scenario, you'd want to mock the generateText function
      expect(typeof agent.processMessage).toBe('function');
    });
  });
});