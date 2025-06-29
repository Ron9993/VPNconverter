
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

// Store user VPN configs, language preferences and selected formats
const userConfigs = new Map();
const userLanguages = new Map();
const userSelectedFormats = new Map();

// Multi-language messages
const messages = {
    en: {
        welcome: `🤖 **Welcome to EdenVault VPN Converter Bot!**

✅ **What I can do:**
• Convert Outline VPN keys to V2Box (Clash) format
• Convert to V2rayNG format  
• Generate Hiddify QR codes

🔧 **How to use:**
1. Choose your preferred format below
2. Send me your Outline VPN key
3. Get the converted config for your chosen format

📝 **Example Outline key format:**
\`ss://Y2hhY2hhMjAtaWV0ZjpwYXNzd29yZEB3d3cuZXhhbXBsZS5jb206ODA4MA==/?outline=1\`

📲 **First, choose your preferred format:**`,
        selectLanguage: "🌍 **Please select your language:**",
        formatSelected: "✅ **Format selected:**",
        sendKey: "Now send me your Outline VPN key to convert it to",
        invalidKey: "❌ Please send a valid Outline VPN key starting with ss://",
        conversionError: "❌ Failed to convert VPN key. Please check the format and try again.",
        noFormatSelected: "❌ Please choose a format first by using /start",
        formatGenerated: "✅ Format generated!",
        errorGenerating: "❌ Error generating format",
        generalError: "❌ An error occurred while generating the format. Please try again.",
        v2rayng: "📱 V2rayNG",
        v2box: "⚔️ V2Box (Clash)",
        hiddify: "🔍 Hiddify (QR)",
        v2rayFormat: "📱 **V2rayNG Format:**",
        v2boxFormat: "⚔️ **V2Box (Clash) Format:**",
        hiddifyQR: "📱 **Hiddify QR Code**",
        howToUseV2ray: "💡 **How to use:**\n1. Copy the JSON config above\n2. Open V2rayNG app\n3. Tap '+' → Import config from clipboard",
        howToUseV2box: "💡 **How to use:**\n1. Copy the YAML config above\n2. Open V2Box app\n3. Add the config to your profiles",
        howToUseHiddify: "💡 **How to use:**\n1. Scan QR code with Hiddify\n2. Or copy URL and import manually",
        changeFormat: "🔄 Change Format",
        keyParsed: "✅ **VPN Key Parsed Successfully!**",
        serverDetails: "🔐 **Server Details:**"
    },
    my: {
        welcome: `🤖 **EdenVault VPN Converter Bot မှ ကြိုဆိုပါတယ်!**

✅ **ကျွန်တော် လုပ်ပေးနိုင်တာများ:**
• Outline VPN keys များကို V2Box (Clash) format သို့ပြောင်းခြင်း
• V2rayNG format သို့ပြောင်းခြင်း  
• Hiddify QR codes များ ဖန်တီးခြင်း

🔧 **အသုံးပြုပုံ:**
1. အောက်တွင် သင့်နှစ်သက်တဲ့ format ကို ရွေးချယ်ပါ
2. သင့်ရဲ့ Outline VPN key ကို ပို့ပါ
3. သင်ရွေးချယ်တဲ့ format အတွက် ပြောင်းလဲထားတဲ့ config ကို ရယူပါ

📝 **Outline key format ဥပမာ:**
\`ss://Y2hhY2hhMjAtaWV0ZjpwYXNzd29yZEB3d3cuZXhhbXBsZS5jb206ODA4MA==/?outline=1\`

📲 **အရင်ဆုံး၊ သင့်နှစ်သက်တဲ့ format ကို ရွေးချယ်ပါ:**`,
        selectLanguage: "🌍 **သင့်ဘာသာစကားကို ရွေးချယ်ပါ:**",
        formatSelected: "✅ **Format ရွေးချယ်ပြီးပါပြီ:**",
        sendKey: "ယခု သင့်ရဲ့ Outline VPN key ကို ပို့ပါ",
        invalidKey: "❌ ss:// နှင့်စတဲ့ မှန်ကန်တဲ့ Outline VPN key ကို ပို့ပါ",
        conversionError: "❌ VPN key ကို ပြောင်းလဲရန် မအောင်မြင်ပါ။ format ကို စစ်ဆေးပြီး ပြန်ကြိုးစားပါ။",
        noFormatSelected: "❌ ကျေးဇူးပြု၍ /start ကို အသုံးပြုပြီး format တစ်ခုကို ရွေးချယ်ပါ",
        formatGenerated: "✅ Format ဖန်တီးပြီးပါပြီ!",
        errorGenerating: "❌ Format ဖန်တီးရာတွင် အမှား",
        generalError: "❌ Format ဖန်တီးရာတွင် အမှားတစ်ခု ဖြစ်ပွားခဲ့သည်။ ပြန်ကြိုးစားပါ။",
        v2rayng: "📱 V2rayNG",
        v2box: "⚔️ V2Box (Clash)",
        hiddify: "🔍 Hiddify (QR)",
        v2rayFormat: "📱 **V2rayNG Format:**",
        v2boxFormat: "⚔️ **V2Box (Clash) Format:**",
        hiddifyQR: "📱 **Hiddify QR Code**",
        howToUseV2ray: "💡 **အသုံးပြုပုံ:**\n1. အပေါ်က JSON config ကို ကူးယူပါ\n2. V2rayNG app ကို ဖွင့်ပါ\n3. '+' ကို နှိပ်ပါ → clipboard မှ config ကို import လုပ်ပါ",
        howToUseV2box: "💡 **အသုံးပြုပုံ:**\n1. အပေါ်က YAML config ကို ကူးယူပါ\n2. V2Box app ကို ဖွင့်ပါ\n3. သင့် profiles တွင် config ကို ထည့်ပါ",
        howToUseHiddify: "💡 **အသုံးပြုပုံ:**\n1. Hiddify နှင့် QR code ကို စကင်န်လုပ်ပါ\n2. သို့မဟုတ် URL ကို ကူးယူပြီး ကိုယ်တိုင် import လုပ်ပါ",
        changeFormat: "🔄 Format ပြောင်းရန်",
        keyParsed: "✅ **VPN Key ကို အောင်မြင်စွာ ဖတ်ပြီးပါပြီ!**",
        serverDetails: "🔐 **ဆာဗာ အသေးစိတ်:**"
    },
    zh: {
        welcome: `🤖 **欢迎使用 EdenVault VPN 转换器机器人！**

✅ **我能做什么：**
• 将 Outline VPN 密钥转换为 V2Box (Clash) 格式
• 转换为 V2rayNG 格式
• 生成 Hiddify 二维码

🔧 **使用方法：**
1. 在下方选择您的首选格式
2. 发送您的 Outline VPN 密钥
3. 获取您选择格式的转换配置

📝 **Outline 密钥格式示例：**
\`ss://Y2hhY2hhMjAtaWV0ZjpwYXNzd29yZEB3d3cuZXhhbXBsZS5jb206ODA4MA==/?outline=1\`

📲 **首先，选择您的首选格式：**`,
        selectLanguage: "🌍 **请选择您的语言：**",
        formatSelected: "✅ **格式已选择：**",
        sendKey: "现在发送您的 Outline VPN 密钥来转换为",
        invalidKey: "❌ 请发送以 ss:// 开头的有效 Outline VPN 密钥",
        conversionError: "❌ 转换 VPN 密钥失败。请检查格式后重试。",
        noFormatSelected: "❌ 请先使用 /start 选择一种格式",
        formatGenerated: "✅ 格式已生成！",
        errorGenerating: "❌ 生成格式时出错",
        generalError: "❌ 生成格式时发生错误。请重试。",
        v2rayng: "📱 V2rayNG",
        v2box: "⚔️ V2Box (Clash)",
        hiddify: "🔍 Hiddify (QR)",
        v2rayFormat: "📱 **V2rayNG 格式：**",
        v2boxFormat: "⚔️ **V2Box (Clash) 格式：**",
        hiddifyQR: "📱 **Hiddify 二维码**",
        howToUseV2ray: "💡 **使用方法：**\n1. 复制上面的 JSON 配置\n2. 打开 V2rayNG 应用\n3. 点击 '+' → 从剪贴板导入配置",
        howToUseV2box: "💡 **使用方法：**\n1. 复制上面的 YAML 配置\n2. 打开 V2Box 应用\n3. 将配置添加到您的配置文件中",
        howToUseHiddify: "💡 **使用方法：**\n1. 用 Hiddify 扫描二维码\n2. 或复制 URL 手动导入",
        changeFormat: "🔄 更改格式",
        keyParsed: "✅ **VPN 密钥解析成功！**",
        serverDetails: "🔐 **服务器详情：**"
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

// Handle callback queries
bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    const userId = ctx.from.id;

    // Handle language selection
    if (data.startsWith('lang_')) {
        const lang = data.split('_')[1];
        userLanguages.set(userId, lang);
        await ctx.answerCbQuery(`✅ Language set to ${lang}`);
        
        // Show format selection after language selection
        await ctx.replyWithMarkdown(
            getMessage(userId, 'welcome'),
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: getMessage(userId, 'v2rayng'), callback_data: 'format_v2rayng' },
                            { text: getMessage(userId, 'v2box'), callback_data: 'format_v2box' }
                        ],
                        [
                            { text: getMessage(userId, 'hiddify'), callback_data: 'format_hiddify' }
                        ]
                    ]
                }
            }
        );
    }
    // Handle format selection
    else if (data.startsWith('format_')) {
        const format = data.split('_')[1];
        userSelectedFormats.set(userId, format);
        
        const formatNames = {
            'v2rayng': getMessage(userId, 'v2rayng'),
            'v2box': getMessage(userId, 'v2box'),
            'hiddify': getMessage(userId, 'hiddify')
        };
        
        await ctx.answerCbQuery(getMessage(userId, 'formatSelected'));
        await ctx.replyWithMarkdown(
            `${getMessage(userId, 'formatSelected')} **${formatNames[format]}**\n\n${getMessage(userId, 'sendKey')} ${formatNames[format]} format.`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: getMessage(userId, 'changeFormat'), callback_data: 'change_format' }
                        ]
                    ]
                }
            }
        );
    }
    // Handle change format
    else if (data === 'change_format') {
        await ctx.answerCbQuery();
        await ctx.replyWithMarkdown(
            getMessage(userId, 'welcome'),
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: getMessage(userId, 'v2rayng'), callback_data: 'format_v2rayng' },
                            { text: getMessage(userId, 'v2box'), callback_data: 'format_v2box' }
                        ],
                        [
                            { text: getMessage(userId, 'hiddify'), callback_data: 'format_hiddify' }
                        ]
                    ]
                }
            }
        );
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

    // Check if user has selected a format
    if (!userSelectedFormats.has(userId)) {
        return ctx.replyWithMarkdown(getMessage(userId, 'noFormatSelected'));
    }

    // Check if it looks like an Outline key
    if (!message.includes('ss://')) {
        return ctx.reply(getMessage(userId, 'invalidKey'));
    }

    try {
        // Parse the Outline key
        const config = parseOutlineKey(message);
        const selectedFormat = userSelectedFormats.get(userId);

        // Generate the requested format
        switch (selectedFormat) {
            case 'v2rayng':
                const v2rayNG = generateV2rayNG(config);
                await ctx.replyWithMarkdown(`
${getMessage(userId, 'keyParsed')}

${getMessage(userId, 'serverDetails')}:
• Server: \`${config.server}\`
• Port: \`${config.port}\`
• Method: \`${config.method}\`

${getMessage(userId, 'v2rayFormat')}:
\`\`\`json
${v2rayNG}
\`\`\`

${getMessage(userId, 'howToUseV2ray')}
                `);
                break;

            case 'v2box':
                const clashYAML = generateClashYAML(config);
                await ctx.replyWithMarkdown(`
${getMessage(userId, 'keyParsed')}

${getMessage(userId, 'serverDetails')}:
• Server: \`${config.server}\`
• Port: \`${config.port}\`
• Method: \`${config.method}\`

${getMessage(userId, 'v2boxFormat')}:
\`\`\`yaml
${clashYAML}
\`\`\`

${getMessage(userId, 'howToUseV2box')}
                `);
                break;

            case 'hiddify':
                const hiddifyURL = generateHiddifyURL(config);
                const qrBuffer = await QRCode.toBuffer(hiddifyURL);

                await ctx.replyWithMarkdown(`
${getMessage(userId, 'keyParsed')}

${getMessage(userId, 'serverDetails')}:
• Server: \`${config.server}\`
• Port: \`${config.port}\`
• Method: \`${config.method}\`
                `);

                await ctx.replyWithPhoto(
                    { source: qrBuffer },
                    {
                        caption: `${getMessage(userId, 'hiddifyQR')}\n\nScan this QR code with Hiddify app\n\nOr use this URL:\n\`${hiddifyURL}\`\n\n${getMessage(userId, 'howToUseHiddify')}`,
                        parse_mode: 'Markdown'
                    }
                );
                break;
        }

        // Add option to change format
        await ctx.replyWithMarkdown(
            "🔄 Want to convert to a different format?",
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: getMessage(userId, 'changeFormat'), callback_data: 'change_format' }
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

// Function to parse Outline VPN key
function parseOutlineKey(outlineKey) {
    try {
        // Extract ss:// URL and remove any query parameters
        const ssMatch = outlineKey.match(/ss:\/\/([^\/\?#]+)@([^\/\?#]+)/);
        if (!ssMatch) {
            throw new Error('Invalid Outline key format');
        }
        
        const encodedAuth = ssMatch[1];
        const serverPort = ssMatch[2];
        
        // Decode the base64 encoded method:password part
        const decodedAuth = Base64.decode(encodedAuth);
        
        // Parse method:password
        const authMatch = decodedAuth.match(/^(.+?):(.+)$/);
        if (!authMatch) {
            throw new Error('Invalid auth format');
        }
        
        // Parse server:port
        const serverMatch = serverPort.match(/^(.+?):(\d+)$/);
        if (!serverMatch) {
            throw new Error('Invalid server:port format');
        }
        
        return {
            method: authMatch[1],
            password: authMatch[2], 
            server: serverMatch[1],
            port: parseInt(serverMatch[2])
        };
    } catch (error) {
        throw new Error('Failed to parse Outline key: ' + error.message);
    }
}

// Function to generate V2rayNG config
function generateV2rayNG(config) {
    const v2rayConfig = {
        v: "2",
        ps: "EdenVault",
        add: config.server,
        port: config.port,
        id: "",
        aid: "0",
        scy: "auto",
        net: "tcp",
        type: "none",
        host: "",
        path: "",
        tls: "",
        sni: "",
        alpn: "",
        fp: ""
    };
    
    return JSON.stringify(v2rayConfig, null, 2);
}

// Function to generate Clash YAML config
function generateClashYAML(config) {
    return `proxies:
  - name: "EdenVault"
    type: ss
    server: ${config.server}
    port: ${config.port}
    cipher: ${config.method}
    password: "${config.password}"
    udp: true

proxy-groups:
  - name: "EdenVault-Group"
    type: select
    proxies:
      - "EdenVault"

rules:
  - MATCH,EdenVault-Group`;
}

// Function to generate Hiddify URL
function generateHiddifyURL(config) {
    const auth = Base64.encode(`${config.method}:${config.password}`);
    return `ss://${auth}@${config.server}:${config.port}#EdenVault`;
}
