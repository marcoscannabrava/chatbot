import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { SlackClient } from './slack';
import { Agent } from './agent';

// Load environment variables
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize clients
const slackClient = new SlackClient(process.env.SLACK_BOT_TOKEN!);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});
const agent = new Agent(openai);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Slack events endpoint
app.post('/slack/events', async (req: Request, res: Response) => {
  try {
    const { headers, body } = req;
    const signature = headers['x-slack-signature'] as string;
    const timestamp = headers['x-slack-request-timestamp'] as string;
    const rawBody = JSON.stringify(body);
    
    // Verify the request is from Slack
    if (!slackClient.verifySlackRequest(signature, timestamp, rawBody)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const event = body;
    
    // Handle URL verification challenge from Slack
    if (event.type === 'url_verification') {
      return res.json({ challenge: event.challenge });
    }
    
    // Handle message events
    if (event.type === 'event_callback' && event.event) {
      const { type, channel, text, user, bot_id } = event.event;
      
      // Ignore bot messages and messages without text
      if (bot_id || !text || type !== 'message') {
        return res.status(200).json({ ok: true });
      }
      
      // Check if the bot is mentioned (you might want to adjust this logic)
      const botUserId = process.env.SLACK_BOT_USER_ID;
      if (!text.includes(`<@${botUserId}>`) && !text.toLowerCase().includes('bot')) {
        return res.status(200).json({ ok: true });
      }
      
      // Process the message with the AI agent
      try {
        const response = await agent.processMessage(text);
        await slackClient.sendMessage(channel, response);
      } catch (error) {
        console.error('Error processing message:', error);
        await slackClient.sendMessage(channel, 'Sorry, I encountered an error processing your request.');
      }
    }
    
    res.status(200).json({ ok: true });
    
  } catch (error) {
    console.error('Error handling Slack event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Slack slash commands endpoint (optional)
app.post('/slack/commands', async (req: Request, res: Response) => {
  try {
    const { text, channel_id, user_name } = req.body;
    
    if (!text) {
      return res.json({
        response_type: 'ephemeral',
        text: 'Please provide a message for me to process!'
      });
    }
    
    // Process the command text with the AI agent
    const response = await agent.processMessage(text);
    
    res.json({
      response_type: 'in_channel',
      text: response
    });
    
  } catch (error) {
    console.error('Error handling slash command:', error);
    res.json({
      response_type: 'ephemeral',
      text: 'Sorry, I encountered an error processing your command.'
    });
  }
});

// Error handling middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(port, () => {
  console.log(`🤖 Slack bot server running on port ${port}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Validate required environment variables
  const requiredEnvVars = ['SLACK_BOT_TOKEN', 'SLACK_SIGNING_SECRET', 'OPENAI_API_KEY'];
  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingVars.length > 0) {
    console.warn(`⚠️  Warning: Missing environment variables: ${missingVars.join(', ')}`);
    console.warn('Please check your .env file');
  } else {
    console.log('✅ All required environment variables are set');
  }
});

export default app;