
require('dotenv/config');
const { Client, IntentsBitField} = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.DirectMessages,
  ],
});

const commandFolders = ['commands'];


client.on('ready', () => {
  console.log('The bot is online!');
});

const configuration = new Configuration({
  apiKey: process.env.API_KEY,
});

const openai = new OpenAIApi(configuration);

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.type === 'DM') {
    try {
      await message.channel.sendTyping();
      // Handle the direct message and send a response
      const response = await handleDirectMessage(message.content); // Implement your logic here
      message.reply(response);
    } catch (error) {
      console.error('Error handling direct message:', error);
    }
  }

  else if (!message.content.startsWith('!')) {
    // Handle conversation in non-direct message channels
    let conversationLog = [
      { role: 'system', content: 'You are a friendly chatbot.' },
    ];
  
    try {
      await message.channel.sendTyping();
      let prevMessages = await message.channel.messages.fetch({ limit: 15 });
      prevMessages.reverse();
      
      prevMessages.forEach((msg) => {
        if (msg.content.startsWith('!')) return;
        if (msg.author.id !== client.user.id && message.author.bot) return;
        if (msg.author.id == client.user.id) {
          conversationLog.push({
            role: 'assistant',
            content: msg.content,
            name: msg.author.username
              .replace(/\s+/g, '_')
              .replace(/[^\w\s]/gi, ''),
          });
        }
  
        if (msg.author.id == message.author.id) {
          conversationLog.push({
            role: 'user',
            content: msg.content,
            name: message.author.username
              .replace(/\s+/g, '_')
              .replace(/[^\w\s]/gi, ''),
          });
        }
      });


      const result = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: conversationLog,
      });
  
      await message.reply(result.data.choices[0].message.content);
    } catch (error) {
      console.error(`Error processing conversation: ${error}`);
    }
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'hey') {
    try {
      await interaction.deferReply(); // Acknowledge the interaction
      await interaction.editReply('Oops Hello'); // Edit the response
    } catch (error) {
      console.error('Error replying to interaction:', error);
    }
  }
});


client.login(process.env.TOKEN);



