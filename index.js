
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

// Welcome message
bot.start((ctx) => {
    const welcomeMessage = `
🤖 **Welcome to EdenVault VPN Converter Bot!**

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

🚀 **Just send me your Outline key to get started!**
    `;
    
    ctx.replyWithMarkdown(welcomeMessage);
});

// Function to parse Outline VPN key
function parseOutlineKey(outlineKey) {
    try {
        // Remove ss:// prefix and ?outline=1 suffix
        let cleanKey = outlineKey.replace('ss://', '').split('/?')[0];
        
        // Decode base64
        let decoded = Base64.decode(cleanKey);
        
        // Parse format: method:password@server:port
        let parts = decoded.match(/(.+):(.+)@(.+):(\d+)/);
        
        if (!parts) {
            throw new Error('Invalid Outline key format');
        }
        
        return {
            method: parts[1],
            password: parts[2],
            server: parts[3],
            port: parseInt(parts[4])
        };
    } catch (error) {
        throw new Error('Failed to parse Outline key: ' + error.message);
    }
}

// Function to generate V2rayNG format
function generateV2rayNG(config) {
    const v2rayConfig = {
        v: "2",
        ps: "EdenVault",
        add: config.server,
        port: config.port.toString(),
        id: config.password,
        aid: "0",
        net: "tcp",
        type: "none",
        host: "",
        tls: "",
        cipher: config.method
    };
    
    return JSON.stringify(v2rayConfig, null, 2);
}

// Function to generate Clash YAML format
function generateClashYAML(config) {
    return `proxies:
  - name: "EdenVault"
    type: ss
    server: ${config.server}
    port: ${config.port}
    cipher: ${config.method}
    password: "${config.password}"`;
}

// Function to generate Hiddify format (SS URL)
function generateHiddifyURL(config) {
    const auth = Base64.encode(`${config.method}:${config.password}`);
    return `ss://${auth}@${config.server}:${config.port}#EdenVault`;
}

// Store user VPN configs temporarily
const userConfigs = new Map();

// Main message handler for VPN keys
bot.on('text', async (ctx) => {
    const message = ctx.message.text;
    
    // Skip if it's a command
    if (message.startsWith('/')) return;
    
    // Check if it looks like an Outline key
    if (!message.includes('ss://')) {
        return ctx.reply('❌ Please send a valid Outline VPN key starting with ss://');
    }
    
    try {
        // Parse the Outline key
        const config = parseOutlineKey(message);
        
        // Store config for this user
        userConfigs.set(ctx.from.id, config);
        
        // Send options with inline buttons
        await ctx.replyWithMarkdown(
            `✅ **VPN Key Parsed Successfully!**

🔐 **Server Details:**
• Server: \`${config.server}\`
• Port: \`${config.port}\`
• Method: \`${config.method}\`

📲 **Choose your preferred format:**`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '📱 V2rayNG', callback_data: 'format_v2rayng' },
                            { text: '⚔️ V2Box (Clash)', callback_data: 'format_v2box' }
                        ],
                        [
                            { text: '🔍 Hiddify (QR)', callback_data: 'format_hiddify' }
                        ],
                        [
                            { text: '📋 All Formats', callback_data: 'format_all' }
                        ]
                    ]
                }
            }
        );
        
    } catch (error) {
        console.error('Conversion error:', error);
        ctx.reply('❌ Failed to convert VPN key. Please check the format and try again.');
    }
});

// Handle inline button callbacks
bot.on('callback_query', async (ctx) => {
    const userId = ctx.from.id;
    const config = userConfigs.get(userId);
    
    if (!config) {
        return ctx.answerCbQuery('❌ No VPN config found. Please send a new Outline key.');
    }
    
    const data = ctx.callbackQuery.data;
    
    try {
        switch (data) {
            case 'format_v2rayng':
                const v2rayNG = generateV2rayNG(config);
                await ctx.replyWithMarkdown(`
📱 **V2rayNG Format:**
\`\`\`json
${v2rayNG}
\`\`\`

💡 **How to use:**
1. Copy the JSON config above
2. Open V2rayNG app
3. Tap '+' → Import config from clipboard
                `);
                break;
                
            case 'format_v2box':
                const clashYAML = generateClashYAML(config);
                await ctx.replyWithMarkdown(`
⚔️ **V2Box (Clash) Format:**
\`\`\`yaml
${clashYAML}
\`\`\`

💡 **How to use:**
1. Copy the YAML config above
2. Open V2Box app
3. Add the config to your profiles
                `);
                break;
                
            case 'format_hiddify':
                const hiddifyURL = generateHiddifyURL(config);
                const qrBuffer = await QRCode.toBuffer(hiddifyURL);
                
                await ctx.replyWithPhoto(
                    { source: qrBuffer },
                    {
                        caption: `📱 **Hiddify QR Code**\n\nScan this QR code with Hiddify app\n\nOr use this URL:\n\`${hiddifyURL}\`\n\n💡 **How to use:**\n1. Scan QR code with Hiddify\n2. Or copy URL and import manually`,
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
📱 **V2rayNG Format:**
\`\`\`json
${v2rayNGAll}
\`\`\`
                `);
                
                // Send Clash YAML format
                await ctx.replyWithMarkdown(`
⚔️ **V2Box (Clash) Format:**
\`\`\`yaml
${clashYAMLAll}
\`\`\`
                `);
                
                // Generate and send QR code for Hiddify
                const qrBufferAll = await QRCode.toBuffer(hiddifyURLAll);
                
                await ctx.replyWithPhoto(
                    { source: qrBufferAll },
                    {
                        caption: `📱 **Hiddify QR Code**\n\nScan this QR code with Hiddify app\n\nOr use this URL:\n\`${hiddifyURLAll}\``,
                        parse_mode: 'Markdown'
                    }
                );
                
                await ctx.replyWithMarkdown(`
✅ **All Formats Generated!**

📲 **Use the formats above in:**
• V2rayNG (JSON config)
• V2Box/Clash (YAML config)  
• Hiddify (QR code or URL)
                `);
                break;
        }
        
        // Answer the callback query
        await ctx.answerCbQuery('✅ Format generated!');
        
    } catch (error) {
        console.error('Callback error:', error);
        await ctx.answerCbQuery('❌ Error generating format');
        ctx.reply('❌ An error occurred while generating the format. Please try again.');
    }
});

// Error handling
bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    ctx.reply('❌ An error occurred. Please try again.');
});

// Start the bot
console.log('🤖 EdenVault VPN Converter Bot starting...');
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

console.log('✅ Bot is running!');
