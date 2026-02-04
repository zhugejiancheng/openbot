/**
 * OpenBot Configuration
 * Contains configuration settings for the application
 */
require('dotenv').config();

module.exports = {
  app: {
    name: 'OpenBot',
    version: '1.0.0',
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development'
  },
  ai: {
    // Configuration for AI integrations
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.MODEL_NAME || 'gpt-3.5-turbo',
      temperature: parseFloat(process.env.TEMPERATURE) || 0.7,
      maxTokens: parseInt(process.env.MAX_TOKENS) || 1000
    }
  },
  database: {
    // Database configuration if needed
    url: process.env.DATABASE_URL
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};