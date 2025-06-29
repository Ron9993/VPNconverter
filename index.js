
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
        
        // Generate different formats
        const v2rayNG = generateV2rayNG(config);
        const clashYAML = generateClashYAML(config);
        const hiddifyURL = generateHiddifyURL(config);
        
        // Send V2rayNG format
        await ctx.replyWithMarkdown(`
📱 **V2rayNG Format:**
\`\`\`json
${v2rayNG}
\`\`\`
        `);
        
        // Send Clash YAML format
        await ctx.replyWithMarkdown(`
⚔️ **V2Box (Clash) Format:**
\`\`\`yaml
${clashYAML}
\`\`\`
        `);
        
        // Generate and send QR code for Hiddify
        const qrBuffer = await QRCode.toBuffer(hiddifyURL);
        
        await ctx.replyWithPhoto(
            { source: qrBuffer },
            {
                caption: `📱 **Hiddify QR Code**\n\nScan this QR code with Hiddify app\n\nOr use this URL:\n\`${hiddifyURL}\``,
                parse_mode: 'Markdown'
            }
        );
        
        // Send summary
        await ctx.replyWithMarkdown(`
✅ **Conversion Complete!**

🔐 **Server Details:**
• Server: \`${config.server}\`
• Port: \`${config.port}\`
• Method: \`${config.method}\`

📲 **Use the formats above in:**
• V2rayNG (JSON config)
• V2Box/Clash (YAML config)  
• Hiddify (QR code or URL)
        `);
        
    } catch (error) {
        console.error('Conversion error:', error);
        ctx.reply('❌ Failed to convert VPN key. Please check the format and try again.');
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
