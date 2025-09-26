# Slack ChatBot Agent

A minimal, self-contained AI-powered Slack bot.

### Key Features

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

- Node.js 18+
- [pnpm](https://pnpm.io/) (a fast, disk space efficient package manager)
- A Slack App with a Bot Token and App-Level Token.

```sh
# Install dependencies
pnpm install

# Development mode with auto-restart
pnpm dev

# Production mode
pnpm start
```

### 2. Slack Setup
- Start server and tunnel it via ngrok `ngrok http 3000`
- Copy ngrok URL into: https://api.slack.com/apps/A09H0C78L2J/event-subscriptions

## Example Usage

Once the bot is running and invited to a channel, you can interact with it:

**User:** @chatbot can you save this idea for me in a file called `marketing.txt`? The slogan is "AI for Everyone".

> **Bot Action:** The agent recognizes the intent to save data, calls `write_file('marketing.txt', 'The slogan is "AI for Everyone".')`.
>
> **Bot Response:** "Okay, I've saved your idea to `marketing.txt`."

---
**User:** @chatbot what was the marketing slogan we talked about?

> **Bot Action:** The agent understands the user is asking for saved information. It might search its memory or decide to look in the files directory. It calls `readFile('marketing.txt')`.
>
> **Bot Response:** "The slogan we saved is: 'The slogan is "AI for Everyone"'. "

