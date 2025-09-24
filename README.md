Of course! Here is a simple and clear README for the repository described. It uses the folder structure you suggested, with minor additions for clarity (`requirements.txt`, `.env`, and a `files/` directory).

---

# Simple Express Slack Bot Agent

A minimal, self-contained example of an AI-powered Slack bot built with Express.js and TypeScript. The bot can understand messages, process images, and use tools to read and write to the local filesystem.

This project is designed for simplicity and clarity, making it an excellent starting point for building more complex AI agents and Slack integrations.

### Key Features

*   **Express Server**: A lightweight web server to handle incoming Slack events, built with TypeScript and managed with `pnpm`.
*   **Slack Integration**: The bot can join channels, receive messages & images, and send responses.
*   **AI Agent with Tools**: An AI agent that can reason about a user's request and decide to use tools.
*   **File I/O Tools**: The agent is equipped with two basic tools: `read_file` and `write_file`.

## How It Works

The workflow is straightforward:

1.  A user sends a message or uploads an image in a Slack channel, mentioning the bot.
2.  Slack sends an event notification to our Express server's webhook endpoint.
3.  The server validates the request and extracts the message content (text and image URL).
4.  The content is passed to the AI Agent.
5.  The Agent analyzes the request. If it needs to access or store information, it uses its file tools (e.g., "Summarize `report.txt`" or "Save this as `idea.txt`").
6.  The Agent generates a final response based on the request and any tool outputs.
7.  The server sends the Agent's response back to the user in the Slack channel.

## Folder Structure

The project is organized into three main components for a clear separation of concerns.

```
.
├── src/
│   ├── server.ts      # Express web server that listens for Slack events
│   ├── slack.ts       # Helper functions for Slack API interactions
│   └── agent.ts       # AI agent logic and tool definitions
├── files/             # A directory for the agent to read/write files
├── .env               # For storing API keys and tokens (not committed to git)
├── package.json       # Node.js dependencies and scripts
└── tsconfig.json      # TypeScript configuration
```

## Setup and Running

Follow these steps to get the bot running locally.

### 1. Prerequisites

*   Node.js 18+
*   [pnpm](https://pnpm.io/) (a fast, disk space efficient package manager)
*   A Slack App with a Bot Token and App-Level Token.
*   An OpenAI API Key (or another LLM provider).

### 2. Clone the Repository

```bash
git clone https://github.com/your-username/simple-express-slack-bot.git
cd simple-express-slack-bot
```

### 3. Configure Environment Variables

Create a `.env` file in the root of the project by copying the example:

```bash
cp .env.example .env
```

Now, open the `.env` file and add your credentials:

```ini
# Found in your Slack App's "OAuth & Permissions" page
SLACK_BOT_TOKEN="xoxb-..."

# Found in your Slack App's "Basic Information" page, under App-Level Tokens
SLACK_APP_TOKEN="xapp-..."

# Your Large Language Model API Key
OPENAI_API_KEY="sk-..."
```

### 4. Install Dependencies

Install the required packages using `pnpm`.

```bash
# Install dependencies
pnpm install
```

### 5. Run the Server

Start the Express server with `pnpm`. The development script will automatically restart the server when you make code changes.

```bash
# Development mode with auto-restart
pnpm dev

# Production mode
pnpm start
```

Your server is now running! You will need to use a tool like [ngrok](https://ngrok.com/) to expose your local server to the internet so Slack can send events to it.

## Implementation Details

*   **`src/server.ts`**: This is the main entry point. It uses `Express` to create a web server. It defines an endpoint (e.g., `/slack/events`) that listens for incoming POST requests from Slack. It handles request verification and delegates the message processing to the agent.

*   **`src/slack.ts`**: This module contains simple helper functions to communicate with the Slack API. For example, `sendMessage(channel, text)` or `downloadImage(url)`. This keeps the server logic clean.

*   **`src/agent.ts`**: This is the core of the bot's intelligence. It initializes an AI agent and defines the tools the agent can use:
    *   **`readFile(filename: string)`**: Reads content from a file inside the `files/` directory.
    *   **`writeFile(filename: string, content: string)`**: Writes content to a file inside the `files/` directory.
    The agent receives the user's prompt and decides which tool to call, if any, to fulfill the request.

## Example Usage

Once the bot is running and invited to a channel, you can interact with it:

**User:** `@YourBot can you save this idea for me in a file called `marketing.txt`? The slogan is "AI for Everyone".`

> **Bot Action:** The agent recognizes the intent to save data, calls `write_file('marketing.txt', 'The slogan is "AI for Everyone".')`.
>
> **Bot Response:** "Okay, I've saved your idea to `marketing.txt`."

---
**User:** `@YourBot what was the marketing slogan we talked about?`

> **Bot Action:** The agent understands the user is asking for saved information. It might search its memory or decide to look in the files directory. It calls `readFile('marketing.txt')`.
>
> **Bot Response:** "The slogan we saved is: 'The slogan is "AI for Everyone"'. "

## Development

### Building the Project

```bash
# Build TypeScript to JavaScript
pnpm build

# Run tests
pnpm test

# Development mode with hot reload
pnpm dev
```

### Project Structure Details

- **TypeScript Configuration**: Strict TypeScript setup with proper types for Node.js, Express, and Jest
- **Testing**: Jest with ts-jest for TypeScript support
- **Hot Reload**: Uses `tsx` for fast development with automatic restarts
- **File Operations**: Safe file operations with path sanitization to prevent directory traversal
- **Error Handling**: Comprehensive error handling throughout the application

### Deployment

For production deployment:

1. Build the project: `pnpm build`
2. Set up your environment variables in production
3. Run: `pnpm start` (runs the compiled JavaScript from `dist/`)
4. Set up a reverse proxy (nginx) and process manager (PM2) as needed
5. Configure your Slack app's Request URL to point to your server's `/slack/events` endpoint

The built application will be in the `dist/` directory and is ready for production deployment.
