import fs from 'fs/promises';
import path from 'path';

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

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

// Tool definitions for the AI agent
export const tools: Tool[] = [
  {
    name: 'read_file',
    description: 'Read content from a file in the files directory',
    parameters: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'The name of the file to read'
        }
      },
      required: ['filename']
    }
  },
  {
    name: 'write_file',
    description: 'Write content to a file in the files directory',
    parameters: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'The name of the file to write'
        },
        content: {
          type: 'string',
          description: 'The content to write to the file'
        }
      },
      required: ['filename', 'content']
    }
  }
];

export async function executeTool(toolCall: ToolCall): Promise<string> {
  const { name, arguments: args } = toolCall;
  
  switch (name) {
    case 'read_file':
      try {
        const content = await readFile(args.filename);
        return `File content: ${content}`;
      } catch (error) {
        return `Error reading file: ${(error as Error).message}`;
      }
    
    case 'write_file':
      try {
        await writeFile(args.filename, args.content);
        return `Successfully wrote to file: ${args.filename}`;
      } catch (error) {
        return `Error writing file: ${(error as Error).message}`;
      }
    
    default:
      return `Unknown tool: ${name}`;
  }
}

// Simple AI agent that can use tools
export class Agent {
  private openai: any;
  
  constructor(openaiClient: any) {
    this.openai = openaiClient;
  }
  
  async processMessage(message: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI assistant with access to file tools. You can read and write files in the files directory. When a user asks to save something to a file or read from a file, use the appropriate tools.
            
            Available tools:
            - read_file(filename): Read content from a file
            - write_file(filename, content): Write content to a file
            
            Always be helpful and use tools when appropriate.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        tools: tools.map(tool => ({
          type: 'function',
          function: tool
        })),
        tool_choice: 'auto'
      });
      
      const assistantMessage = response.choices[0].message;
      
      // Check if the assistant wants to use tools
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        let finalResponse = assistantMessage.content || '';
        
        for (const toolCall of assistantMessage.tool_calls) {
          const toolResult = await executeTool({
            name: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments)
          });
          
          // Get final response after tool execution
          const followUpResponse = await this.openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful AI assistant. Provide a natural response based on the tool result.'
              },
              {
                role: 'user',
                content: message
              },
              {
                role: 'assistant',
                content: assistantMessage.content,
                tool_calls: assistantMessage.tool_calls
              },
              {
                role: 'tool',
                tool_call_id: toolCall.id,
                content: toolResult
              }
            ]
          });
          
          finalResponse = followUpResponse.choices[0].message.content || 'Tool executed successfully.';
        }
        
        return finalResponse;
      }
      
      return assistantMessage.content || 'I apologize, but I could not generate a response.';
      
    } catch (error) {
      console.error('Error processing message:', error);
      return 'I apologize, but I encountered an error while processing your request.';
    }
  }
}