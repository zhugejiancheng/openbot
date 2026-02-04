/**
 * Chat Processing Utilities for OpenBot
 * Handles processing of chat messages and interaction with AI APIs
 */

const OpenAI = require('openai');
const config = require('../config/config');

let openai = null;

// Initialize OpenAI client if API key is available
if (config.ai.openai.apiKey) {
  openai = new OpenAI({
    apiKey: config.ai.openai.apiKey
  });
}

/**
 * Process a chat message using AI
 * @param {string} message - The user's message
 * @param {object} context - Additional context for the conversation
 * @returns {Promise<string>} - The AI-generated response
 */
async function processChatMessage(message, context = {}) {
  try {
    if (!openai) {
      // Fallback response if no API key is configured
      return `I received your message: "${message}". This is OpenBot responding. Currently running in demo mode without an AI API key. To enable full AI capabilities, please configure your AI API key in the environment variables.`;
    }

    // Prepare the messages array for the API call
    const messages = [
      {
        role: 'system',
        content: 'You are OpenBot, a helpful AI assistant. Respond to user queries in a helpful and informative manner.'
      }
    ];

    // Add conversation history if available
    if (context.history && Array.isArray(context.history)) {
      messages.push(...context.history);
    }

    // Add the current user message
    messages.push({
      role: 'user',
      content: message
    });

    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: config.ai.openai.model,
      messages: messages,
      temperature: config.ai.openai.temperature,
      max_tokens: config.ai.openai.maxTokens,
    });

    // Extract and return the response
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error processing chat message:', error);
    throw new Error(`Failed to process chat message: ${error.message}`);
  }
}

/**
 * Validate if AI is properly configured
 * @returns {boolean} - True if AI is configured, false otherwise
 */
function isAIConfigured() {
  return !!config.ai.openai.apiKey;
}

module.exports = {
  processChatMessage,
  isAIConfigured
};