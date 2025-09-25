import fs from 'fs/promises';
import path from 'path';
import { generateText, jsonSchema } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

const FILES_DIR = path.join(process.cwd(), 'files');

// Ensure files directory exists
async function ensureFilesDir(): Promise<void> {
  try {
    await fs.access(FILES_DIR);
  } catch {
    await fs.mkdir(FILES_DIR, { recursive: true });
  }
}

export async function readFile(filename: string): Promise<string> {
  await ensureFilesDir();
  
  // Sanitize filename to prevent directory traversal
  const safeName = path.basename(filename);
  const filePath = path.join(FILES_DIR, safeName);
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    throw new Error(`Failed to read file ${filename}: ${(error as Error).message}`);
  }
}

export async function writeFile(filename: string, content: string): Promise<void> {
  await ensureFilesDir();
  
  // Sanitize filename to prevent directory traversal
  const safeName = path.basename(filename);
  const filePath = path.join(FILES_DIR, safeName);
  
  try {
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write file ${filename}: ${(error as Error).message}`);
  }
}



// AI agent that uses AI SDK tools for file operations
export class Agent {
  private model: any;
  
  constructor() {
    this.model = google(process.env.GOOGLE_MODEL || 'gemini-2.5-flash');
  }
  
  async processMessage(message: string): Promise<string> {
    try {
      const result = await generateText({
        model: this.model,
        system: 'You are a helpful AI assistant with access to file operations. You can read and write files in the files directory. Use the appropriate tools when users ask about file operations.',
        prompt: message,
        tools: {
          readFile: {
            description: 'Read the contents of a file from the files directory',
            inputSchema: jsonSchema(z.object({
              filename: z.string().describe('The name of the file to read')
            })),
            execute: async ({ filename }) => {
              try {
                const content = await readFile(filename);
                return { success: true, content };
              } catch (error) {
                return { success: false, error: (error as Error).message };
              }
            }
          },
          writeFile: {
            description: 'Write content to a file in the files directory',
            inputSchema: jsonSchema(z.object({
              filename: z.string().describe('The name of the file to write'),
              content: z.string().describe('The content to write to the file')
            })),
            execute: async ({ filename, content }) => {
              try {
                await writeFile(filename, content);
                return { success: true, message: `Successfully wrote content to ${filename}` };
              } catch (error) {
                return { success: false, error: (error as Error).message };
              }
            }
          }
        }
      });

      return result.text;
      
    } catch (error) {
      console.error('Error processing message:', error);
      return 'I apologize, but I encountered an error while processing your request.';
    }
  }
}