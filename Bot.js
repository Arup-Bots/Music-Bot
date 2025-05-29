const TelegramBot = require('node-telegram-bot-api');
const { request } = require('undici');
const axios = require('axios');
const fs = require('fs');

const token = '7962687823:AAEyrUbqWN9T8djVP5pUz4DpDOcprR0KMXc';
const bot = new TelegramBot(token, { polling: true });

// Welcome message handler
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = `
🎵 *Welcome to Music Download Bot!* 🎵

🎧 I can help you find and download your favorite songs!
🔍 Just send me the name of any song you want.

🌟 Enjoy unlimited music at your fingertips!
    `;
    
    bot.sendMessage(chatId, welcomeMessage, {
        parse_mode: 'Markdown'
    });
});

// Handle incoming messages
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text;

    if (messageText.startsWith('/')) return;

    try {
        const searchingMsg = await bot.sendMessage(chatId, '🔍 Searching for your song...');

        // Search for the song
        const searchResponse = await request(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(messageText)}`);
        const searchData = await searchResponse.body.json();

        if (!searchData.success || !searchData.data.results.length) {
            await bot.editMessageText('❌ No songs found!', {
                chat_id: chatId,
                message_id: searchingMsg.message_id
            });
            return;
        }

        // Get song details
        const song = searchData.data.results[0];
        const downloadUrl = song.downloadUrl[0].url;
        const songName = song.name;
        const artistName = song.artists.primary[0].name;
        const songImage = song.image[0].url;

        try {
            // Download the song
            const response = await axios({
                method: 'GET',
                url: downloadUrl,
                responseType: 'stream'
            });

            const tempFile = `temp_${Date.now()}.mp3`;
            const writer = fs.createWriteStream(tempFile);

            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // Prepare caption with song details
            const caption = `
🎵 *${songName}*
👨‍🎤 Artist: ${artistName}
🌍 Language: ${song.language || 'Unknown'}
${song.year ? `📅 Year: ${song.year}` : ''}
${song.duration ? `⏱ Duration: ${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}` : ''}
            `;

            // Create inline keyboard
            const inlineKeyboard = {
                inline_keyboard: [
                    [
                        { text: '💝 Donate Now', callback_data: 'donate' },
                        { text: '🤝 Support', callback_data: 'support' }
                    ]
                ]
            };

            // Send complete message with audio, thumbnail, and buttons
            await bot.sendAudio(chatId, tempFile, {
                caption: caption,
                parse_mode: 'Markdown',
                title: songName,
                performer: artistName,
                thumb: songImage,
                reply_markup: inlineKeyboard
            });

            // Clean up
            fs.unlinkSync(tempFile);
            await bot.deleteMessage(chatId, searchingMsg.message_id);

        } catch (error) {
            await bot.editMessageText('❌ Sorry, failed to download the song.', {
                chat_id: chatId,
                message_id: searchingMsg.message_id
            });
            console.error('Download error:', error);
        }

    } catch (error) {
        await bot.sendMessage(chatId, '❌ Sorry, an error occurred while searching for the song.');
        console.error('Search error:', error);
    }
});

// Handle button callbacks
bot.on('callback_query', async (query) => {
    if (query.data === 'donate') {
        await bot.answerCallbackQuery(query.id, {
            text: '💝 Donate feature coming soon!'
        });
    } else if (query.data === 'support') {
        await bot.answerCallbackQuery(query.id, {
            text: '🤝 Support feature coming soon!'
        });
    }
});
