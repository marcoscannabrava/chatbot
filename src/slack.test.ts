import { SlackClient } from './slack';

describe('SlackClient', () => {
  let slackClient: SlackClient;
  
  beforeEach(() => {
    // Use a dummy token for testing
    slackClient = new SlackClient('xoxb-test-token');
    
    // Mock environment variable
    process.env.SLACK_SIGNING_SECRET = 'test-signing-secret';
  });
  
  afterEach(() => {
    delete process.env.SLACK_SIGNING_SECRET;
  });

  describe('verifySlackRequest', () => {
    it('should reject requests with invalid timestamp', () => {
      const signature = 'v0=invalid';
      const timestamp = '0'; // Very old timestamp
      const body = 'test body';
      
      const result = slackClient.verifySlackRequest(signature, timestamp, body);
      
      expect(result).toBe(false);
    });

    it('should reject requests when signing secret is missing', () => {
      delete process.env.SLACK_SIGNING_SECRET;
      
      const signature = 'v0=test';
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = 'test body';
      
      const result = slackClient.verifySlackRequest(signature, timestamp, body);
      
      expect(result).toBe(false);
    });

    it('should handle valid timestamp but invalid signature', () => {
      // Create a signature with the right format but wrong content (64 hex chars)
      const signature = 'v0=' + 'a'.repeat(64);
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = 'test body';
      
      const result = slackClient.verifySlackRequest(signature, timestamp, body);
      
      expect(result).toBe(false);
    });
  });
});