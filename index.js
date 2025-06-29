require('dotenv').config();
const { Telegraf } = require('telegraf');
const QRCode = require('qrcode');
const { Base64 } = require('js-base64');

// Bot configuration from environment variables
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

if (!BOT_TOKEN) {
    console.error('BOT_TOKEN is required in .env file');
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Store user VPN configs and language preferences temporarily
const userConfigs = new Map();
const userLanguages = new Map();

// Multi-language messages
const messages = {
    en: {
        welcome: `🤖 **Welcome to EdenVault VPN Converter Bot!**

✅ **What I can do:**
• Convert Outline VPN keys to V2Box (Clash) format
• Convert to V2rayNG format  
• Generate Hiddify QR codes

🔧 **How to use:**
1. Send me your Outline VPN key
2. I'll convert it to multiple formats
3. Use the converted configs in your preferred VPN app

📝 **Example Outline key format:**
\`ss://Y2hhY2hhMjAtaWV0ZjpwYXNzd29yZEB3d3cuZXhhbXBsZS5jb206ODA4MA==/?outline=1\`

🚀 **Just send me your Outline key to get started!**`,
        selectLanguage: "🌍 **Please select your language:**",
        keyParsed: "✅ **VPN Key Parsed Successfully!**",
        serverDetails: "🔐 **Server Details:**",
        chooseFormat: "📲 **Choose your preferred format:**",
        invalidKey: "❌ Please send a valid Outline VPN key starting with ss://",
        conversionError: "❌ Failed to convert VPN key. Please check the format and try again.",
        noConfig: "❌ No VPN config found. Please send a new Outline key.",
        formatGenerated: "✅ Format generated!",
        errorGenerating: "❌ Error generating format",
        generalError: "❌ An error occurred while generating the format. Please try again.",
        v2rayng: "📱 V2rayNG",
        v2box: "⚔️ V2Box (Clash)",
        hiddify: "🔍 Hiddify (QR)",
        allFormats: "📋 All Formats",
        v2rayFormat: "📱 **V2rayNG Format:**",
        v2boxFormat: "⚔️ **V2Box (Clash) Format:**",
        hiddifyQR: "📱 **Hiddify QR Code**",
        howToUseV2ray: "💡 **How to use:**\n1. Copy the JSON config above\n2. Open V2rayNG app\n3. Tap '+' → Import config from clipboard",
        howToUseV2box: "💡 **How to use:**\n1. Copy the YAML config above\n2. Open V2Box app\n3. Add the config to your profiles",
        howToUseHiddify: "💡 **How to use:**\n1. Scan QR code with Hiddify\n2. Or copy URL and import manually",
        allFormatsGenerated: "✅ **All Formats Generated!**",
        useFormats: "📲 **Use the formats above in:**\n• V2rayNG (JSON config)\n• V2Box/Clash (YAML config)\n• Hiddify (QR code or URL)"
    },
    my: {
        welcome: `🤖 **EdenVault VPN Converter Bot မှ ကြိုဆိုပါတယ်!**

✅ **ကျွန်တော် လုပ်ပေးနိုင်တာများ:**
• Outline VPN keys များကို V2Box (Clash) format သို့ပြောင်းခြင်း
• V2rayNG format သို့ပြောင်းခြင်း  
• Hiddify QR codes များ ဖန်တီးခြင်း

🔧 **အသုံးပြုပုံ:**
1. သင့်ရဲ့ Outline VPN key ကို ပို့ပါ
2. ကျွန်တော် format အမျိုးမျိုးသို့ ပြောင်းပေးမယ်
3. သင့်နှစ်သက်တဲ့ VPN app မှာ အသုံးပြုပါ

📝 **Outline key format ဥပမာ:**
\`ss://Y2hhY2hhMjAtaWV0ZjpwYXNzd29yZEB3d3cuZXhhbXBsZS5jb206ODA4MA==/?outline=1\`

🚀 **စတင်ရန် သင့်ရဲ့ Outline key ကို ပို့လိုက်ပါ!**`,
        selectLanguage: "🌍 **သင့်ဘာသာစကားကို ရွေးချယ်ပါ:**",
        keyParsed: "✅ **VPN Key ကို အောင်မြင်စွာ ဖတ်ပြီးပါပြီ!**",
        serverDetails: "🔐 **ဆာဗာ အသေးစိတ်:**",
        chooseFormat: "📲 **သင်နှစ်သက်တဲ့ format ကို ရွေးချယ်ပါ:**",
        invalidKey: "❌ ss:// နှင့်စတဲ့ မှန်ကန်တဲ့ Outline VPN key ကို ပို့ပါ",
        conversionError: "❌ VPN key ကို ပြောင်းလဲရန် မအောင်မြင်ပါ။ format ကို စစ်ဆေးပြီး ပြန်ကြိုးစားပါ။",
        noConfig: "❌ VPN config မတွေ့ပါ။ Outline key အသစ်တစ်ခုကို ပို့ပါ။",
        formatGenerated: "✅ Format ဖန်တီးပြီးပါပြီ!",
        errorGenerating: "❌ Format ဖန်တီးရာတွင် အမှား",
        generalError: "❌ Format ဖန်တီးရာတွင် အမှားတစ်ခု ဖြစ်ပွားခဲ့သည်။ ပြန်ကြိုးစားပါ။",
        v2rayng: "📱 V2rayNG",
        v2box: "⚔️ V2Box (Clash)",
        hiddify: "🔍 Hiddify (QR)",
        allFormats: "📋 Format အားလုံး",
        v2rayFormat: "📱 **V2rayNG Format:**",
        v2boxFormat: "⚔️ **V2Box (Clash) Format:**",
        hiddifyQR: "📱 **Hiddify QR Code**",
        howToUseV2ray: "💡 **အသုံးပြုပုံ:**\n1. အပေါ်က JSON config ကို ကူးယူပါ\n2. V2rayNG app ကို ဖွင့်ပါ\n3. '+' ကို နှိပ်ပါ → clipboard မှ config ကို import လုပ်ပါ",
        howToUseV2box: "💡 **အသုံးပြုပုံ:**\n1. အပေါ်က YAML config ကို ကူးယူပါ\n2. V2Box app ကို ဖွင့်ပါ\n3. သင့် profiles တွင် config ကို ထည့်ပါ",
        howToUseHiddify: "💡 **အသုံးပြုပုံ:**\n1. Hiddify နှင့် QR code ကို စကင်န်လုပ်ပါ\n2. သို့မဟုတ် URL ကို ကူးယူပြီး ကိုယ်တိုင် import လုပ်ပါ",
        allFormatsGenerated: "✅ **Format အားလုံးကို ဖန်တီးပြီးပါပြီ!**",
        useFormats: "📲 **အပေါ်က formats များကို အသုံးပြုပါ:**\n• V2rayNG (JSON config)\n• V2Box/Clash (YAML config)\n• Hiddify (QR code or URL)"
    },
    zh: {
        welcome: `🤖 **欢迎使用 EdenVault VPN 转换器机器人！**

✅ **我能做什么：**
• 将 Outline VPN 密钥转换为 V2Box (Clash) 格式
• 转换为 V2rayNG 格式
• 生成 Hiddify 二维码

🔧 **使用方法：**
1. 发送您的 Outline VPN 密钥
2. 我将转换为多种格式
3. 在您喜欢的 VPN 应用中使用转换后的配置

📝 **Outline 密钥格式示例：**
\`ss://Y2hhY2hhMjAtaWV0ZjpwYXNzd29yZEB3d3cuZXhhbXBsZS5jb206ODA4MA==/?outline=1\`

🚀 **发送您的 Outline 密钥开始使用！**`,
        selectLanguage: "🌍 **请选择您的语言：**",
        keyParsed: "✅ **VPN 密钥解析成功！**",
        serverDetails: "🔐 **服务器详情：**",
        chooseFormat: "📲 **选择您首选的格式：**",
        invalidKey: "❌ 请发送以 ss:// 开头的有效 Outline VPN 密钥",
        conversionError: "❌ 转换 VPN 密钥失败。请检查格式后重试。",
        noConfig: "❌ 未找到 VPN 配置。请发送新的 Outline 密钥。",
        formatGenerated: "✅ 格式已生成！",
        errorGenerating: "❌ 生成格式时出错",
        generalError: "❌ 生成格式时发生错误。请重试。",
        v2rayng: "📱 V2rayNG",
        v2box: "⚔️ V2Box (Clash)",
        hiddify: "🔍 Hiddify (QR)",
        allFormats: "📋 所有格式",
        v2rayFormat: "📱 **V2rayNG 格式：**",
        v2boxFormat: "⚔️ **V2Box (Clash) 格式：**",
        hiddifyQR: "📱 **Hiddify 二维码**",
        howToUseV2ray: "💡 **使用方法：**\n1. 复制上面的 JSON 配置\n2. 打开 V2rayNG 应用\n3. 点击 '+' → 从剪贴板导入配置",
        howToUseV2box: "💡 **使用方法：**\n1. 复制上面的 YAML 配置\n2. 打开 V2Box 应用\n3. 将配置添加到您的配置文件中",
        howToUseHiddify: "💡 **使用方法：**\n1. 用 Hiddify 扫描二维码\n2. 或复制 URL 手动导入",
        allFormatsGenerated: "✅ **所有格式已生成！**",
        useFormats: "📲 **在以下应用中使用上述格式：**\n• V2rayNG (JSON 配置)\n• V2Box/Clash (YAML 配置)\n• Hiddify (二维码或 URL)"
    }
};

// Function to get user's language or default to English
function getUserLanguage(userId) {
    return userLanguages.get(userId) || 'en';
}

// Function to get message in user's language
function getMessage(userId, key) {
    const lang = getUserLanguage(userId);
    return messages[lang][key];
}

// Welcome message with language selection
bot.start((ctx) => {
    ctx.replyWithMarkdown(
        messages.en.selectLanguage,
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '🇬🇧 English', callback_data: 'lang_en' },
                        { text: '🇲🇲 မြန်မာ', callback_data: 'lang_my' }
                    ],
                    [
                        { text: '🇨🇳 中文', callback_data: 'lang_zh' }
                    ]
                ]
            }
        }
    );
});

// Handle language selection
bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    const userId = ctx.from.id;

    if (data.startsWith('lang_')) {
        const lang = data.split('_')[1];
        userLanguages.set(userId, lang);
        await ctx.answerCbQuery(`✅ Language set to ${lang}`);
        await ctx.replyWithMarkdown(getMessage(userId, 'welcome'));
    } else {
        // Existing callback handling
        const config = userConfigs.get(userId);

        if (!config) {
            return ctx.answerCbQuery(getMessage(userId, 'noConfig'));
        }

        try {
            switch (data) {
                case 'format_v2rayng':
                    const v2rayNG = generateV2rayNG(config);
                    await ctx.replyWithMarkdown(`
${getMessage(userId, 'v2rayFormat')}:
\`\`\`json
${v2rayNG}
\`\`\`

${getMessage(userId, 'howToUseV2ray')}
                `);
                    break;

                case 'format_v2box':
                    const clashYAML = generateClashYAML(config);
                    await ctx.replyWithMarkdown(`
${getMessage(userId, 'v2boxFormat')}:
\`\`\`yaml
${clashYAML}
\`\`\`

${getMessage(userId, 'howToUseV2box')}
                `);
                    break;

                case 'format_hiddify':
                    const hiddifyURL = generateHiddifyURL(config);
                    const qrBuffer = await QRCode.toBuffer(hiddifyURL);

                    await ctx.replyWithPhoto(
                        { source: qrBuffer },
                        {
                            caption: `${getMessage(userId, 'hiddifyQR')}\n\nScan this QR code with Hiddify app\n\nOr use this URL:\n\`${hiddifyURL}\`\n\n${getMessage(userId, 'howToUseHiddify')}`,
                            parse_mode: 'Markdown'
                        }
                    );
                    break;

                case 'format_all':
                    const v2rayNGAll = generateV2rayNG(config);
                    const clashYAMLAll = generateClashYAML(config);
                    const hiddifyURLAll = generateHiddifyURL(config);

                    // Send V2rayNG format
                    await ctx.replyWithMarkdown(`
${getMessage(userId, 'v2rayFormat')}:
\`\`\`json
${v2rayNGAll}
\`\`\`
                `);

                    // Send Clash YAML format
                    await ctx.replyWithMarkdown(`
${getMessage(userId, 'v2boxFormat')}:
\`\`\`yaml
${clashYAMLAll}
\`\`\`
                `);

                    // Generate and send QR code for Hiddify
                    const qrBufferAll = await QRCode.toBuffer(hiddifyURLAll);

                    await ctx.replyWithPhoto(
                        { source: qrBufferAll },
                        {
                            caption: `${getMessage(userId, 'hiddifyQR')}\n\nScan this QR code with Hiddify app\n\nOr use this URL:\n\`${hiddifyURLAll}\``,
                            parse_mode: 'Markdown'
                        }
                    );

                    await ctx.replyWithMarkdown(`
${getMessage(userId, 'allFormatsGenerated')}

${getMessage(userId, 'useFormats')}
                `);
                    break;
            }

            // Answer the callback query
            await ctx.answerCbQuery(getMessage(userId, 'formatGenerated'));

        } catch (error) {
            console.error('Callback error:', error);
            await ctx.answerCbQuery(getMessage(userId, 'errorGenerating'));
            ctx.reply(getMessage(userId, 'generalError'));
        }
    }
});

// Main message handler for VPN keys
bot.on('text', async (ctx) => {
    const message = ctx.message.text;
    const userId = ctx.from.id;

    // Skip if it's a command
    if (message.startsWith('/')) return;

    // Check if user has selected a language
    if (!userLanguages.has(userId)) {
        return ctx.replyWithMarkdown(messages.en.selectLanguage, {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '🇬🇧 English', callback_data: 'lang_en' },
                        { text: '🇲🇲 မြန်မာ', callback_data: 'lang_my' }
                    ],
                    [
                        { text: '🇨🇳 中文', callback_data: 'lang_zh' }
                    ]
                ]
            }
        });
    }

    // Check if it looks like an Outline key
    if (!message.includes('ss://')) {
        return ctx.reply(getMessage(userId, 'invalidKey'));
    }

    try {
        // Parse the Outline key
        const config = parseOutlineKey(message);

        // Store config for this user
        userConfigs.set(ctx.from.id, config);

        // Send options with inline buttons
        await ctx.replyWithMarkdown(
            `${getMessage(userId, 'keyParsed')}

${getMessage(userId, 'serverDetails')}:
• Server: \`${config.server}\`
• Port: \`${config.port}\`
• Method: \`${config.method}\`

${getMessage(userId, 'chooseFormat')}`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: getMessage(userId, 'v2rayng'), callback_data: 'format_v2rayng' },
                            { text: getMessage(userId, 'v2box'), callback_data: 'format_v2box' }
                        ],
                        [
                            { text: getMessage(userId, 'hiddify'), callback_data: 'format_hiddify' }
                        ],
                        [
                            { text: getMessage(userId, 'allFormats'), callback_data: 'format_all' }
                        ]
                    ]
                }
            }
        );

    } catch (error) {
        console.error('Conversion error:', error);
        ctx.reply(getMessage(userId, 'conversionError'));
    }
});

// Error handling
bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    ctx.reply(getMessage(ctx.from.id, 'generalError'));
});

// Start the bot
console.log('🤖 EdenVault VPN Converter Bot starting...');
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

console.log('✅ Bot is running!');