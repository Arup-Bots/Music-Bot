const axios = require('axios');
const { portfolioUrl, upiId } = require('../config/config');

const handleButtons = (bot) => {
    bot.on('callback_query', async (query) => {
        const chatId = query.message.chat.id;

        switch (query.data) {
            case 'donate':
                try {
                    // Generate UPI QR code URL
                    const upiData = {
                        pa: upiId,
                        pn: "Music Bot Support",
                        am: "",  // Amount is optional
                        cu: "INR"
                    };
                    
                    // Create QR code URL using UPI parameters
                    const qrCodeUrl = `https://upiqr.in/api/qr?name=${upiData.pn}&vpa=${upiData.pa}`;

                    // Send QR code image with donation confirmation button
                    await bot.sendPhoto(chatId, qrCodeUrl, {
                        caption: "Scan this QR code to donate! 🙏\nUPI ID: `" + upiId + "`",
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [[
                                { text: '✅ I have donated', callback_data: 'donation_confirmed' }
                            ]]
                        }
                    });

                } catch (error) {
                    console.error('QR generation error:', error);
                    await bot.sendMessage(chatId, '❌ Sorry, there was an error generating the QR code.');
                }
                break;

            case 'donation_confirmed':
                await bot.answerCallbackQuery(query.id);
                await bot.sendMessage(chatId, `
🎉 *Thank you for your donation!* 🎉

Your support means a lot and helps keep this bot running.
Stay tuned for more awesome features! 💫

🤗 Have a great day!`, {
                    parse_mode: 'Markdown'
                });
                break;

            case 'support':
                await bot.answerCallbackQuery(query.id);
                await bot.sendMessage(chatId, `🌐 Visit my portfolio for more projects!`, {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '🔗 Open Portfolio', url: portfolioUrl }
                        ]]
                    }
                });
                break;
        }
    });
};

module.exports = handleButtons;
