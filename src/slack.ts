import { WebClient } from '@slack/web-api';
import axios from 'axios';
import * as crypto from 'crypto';

export class SlackClient {
  private client: WebClient;
  
  constructor(token: string) {
    this.client = new WebClient(token);
  }
  
  async sendMessage(channel: string, text: string): Promise<void> {
    try {
      await this.client.chat.postMessage({
        channel,
        text
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message to Slack');
    }
  }
  
  async downloadImage(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`
        }
      });
      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error downloading image:', error);
      throw new Error('Failed to download image');
    }
  }
  
  verifySlackRequest(signature: string, timestamp: string, body: string): boolean {
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    
    if (!signingSecret) {
      console.error('SLACK_SIGNING_SECRET not found');
      return false;
    }
    
    // Check timestamp (should be within 5 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp);
    
    if (Math.abs(currentTime - requestTime) > 300) {
      console.error('Request timestamp is too old');
      return false;
    }
    
    // Verify signature
    const baseString = `v0:${timestamp}:${body}`;
    const mySignature = 'v0=' + crypto
      .createHmac('sha256', signingSecret)
      .update(baseString, 'utf8')
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(mySignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  }
}