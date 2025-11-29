// =========================================================
//  SUPER BOT — FIXED + RENDER-COMPATIBLE + ONE FILE
//  Features:
//  • Natural language “/do” command
//  • Tickets
//  • Welcome messages (channel only)
//  • Battalion auto-setup
//  • Role creation
//  • Anti-Spam
//  • Prefix moderation (!ban !kick !mute !clear)
//  • Proper ready() + correct slash registration
// =========================================================

const {
    Client,
    GatewayIntentBits,
    Partials,
    SlashCommandBuilder,
    REST,
    Routes
} = require("discord.js");
require("dotenv").config();

// ------------------------------------------------------------
// CONFIG
// ------------------------------------------------------------
const PREFIX = "!";
const FOUNDER_ROLE = "Founder";
const WELCOME_CHANNEL_ID = "1443794131703959596";  // 👋│welcome

// ------------------------------------------------------------
// CLIENT INIT
// ------------------------------------------------------------
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

// ------------------------------------------------------------
// ANTI-SPAM
// ------------------------------------------------------------
const spamMap = new Map();
const SPAM_LIMIT = 5;
const SPAM_TIME = 5000;

function checkSpam(msg) {
    const id = msg.author.id;
    const now = Date.now();

    if (!spamMap.has(id)) spamMap.set(id, []);
    const timestamps = spamMap.get(id);

    timestamps.push(now);

    const filtered = timestamps.filter(t => now - t < SPAM_TIME);
    spamMap.set(id, filtered);

    if (filtered.length >= SPAM_LIMIT) {
        const muted = msg.guild.roles.cache.find(r => r.name === "Muted");
        if (muted) msg.member.roles.add(muted).catch(() => {});

        msg.channel.send(`⚠️ ${msg.author} was muted for spam.`);
        return true;
    }
    return false;
}

// ------------------------------------------------------------
// NATURAL LANGUAGE INTERPRETER
// ------------------------------------------------------------
async function interpretInstruction(text) {
    text = text.toLowerCase();

    if (text.includes("create") && text.includes("battalion")) {
        const name = text.match(/create (.+?) battalion/)?.[1] || "unnamed";
        return {
            type: "create_battalion",
            name: name.trim(),
            channels: ["general", "officers", "training", "commands"]
        };
    }

    if (text.includes("ticket")) {
        return { type: "tickets" };
    }

    if (text.includes("create") && text.includes("role")) {
        const name = text.match(/role (.+)$/)?.[1] || "Unnamed Role";
        return { type: "role", name };
    }

    if (text.includes("promote")) {
        return { type: "promote" };
    }

    throw new Error("I could not understand your request.");
}

// ------------------------------------------------------------
// PLAN EXECUTION
// ------------------------------------------------------------
async function executePlan(plan, interaction) {
    const guild = interaction.guild;

    if (plan.type === "create_battalion") {
        const category = await guild.channels.create({
            name: `${plan.name} Battalion`,
            type: 4
        });

        const role = await guild.roles.create({ name: plan.name });

        for (const ch of plan.channels) {
            await guild.channels.create({
                name: `${plan.name}-${ch}`,
                type: 0,
                parent: category.id
            });
        }

        return `✅ Battalion **${plan.name}** created with category, channels, and role.`;
    }

    if (plan.type === "tickets") {
        const cat = await guild.channels.create({
            name: "Tickets",
            type: 4
        });

        const ch = await guild.channels.create({
            name: "create-a-ticket",
            parent: cat.id,
            type: 0
        });

        await ch.send("🎫 Use `/ticket` to open a support ticket.");
        return "🎫 Ticket system created.";
    }

    if (plan.type === "role") {
        const role = await guild.roles.create({ name: plan.name });
        return `🔧 Role **${role.name}** created.`;
    }

    if (plan.type === "promote") {
        return "✅ Promotion system is active (expandable).";
    }

    return "❓ Unknown plan.";
}

// ------------------------------------------------------------
// SLASH COMMAND DEFINITIONS
// ------------------------------------------------------------
const commands = [
    new SlashCommandBuilder()
        .setName("do")
        .setDescription("Give the bot complex English instructions.")
        .addStringOption(opt =>
            opt.setName("instruction")
               .setDescription("Tell the bot what to do.")
               .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Open a support ticket.")
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

// ------------------------------------------------------------
// READY EVENT — Register commands after login
// ------------------------------------------------------------
client.once("ready", async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);

    try {
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log("✅ Slash Commands Registered.");
    } catch (err) {
        console.error("❌ Failed to register slash commands:", err);
    }
});

// ------------------------------------------------------------
// SLASH COMMAND HANDLER
// ------------------------------------------------------------
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "do") {
        if (!interaction.member.roles.cache.some(r => r.name === FOUNDER_ROLE))
            return interaction.reply({ content: "❌ Founder only.", ephemeral: true });

        const text = interaction.options.getString("instruction");

        try {
            const plan = await interpretInstruction(text);
            const result = await executePlan(plan, interaction);
            await interaction.reply(result);
        } catch (err) {
            await interaction.reply({ content: "❌ " + err.message, ephemeral: true });
        }
    }

    if (interaction.commandName === "ticket") {
        const ch = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: 0
        });

        await ch.send(`📩 ${interaction.user}, staff will assist you shortly.`);
        await interaction.reply({ content: "Ticket created!", ephemeral: true });
    }
});

// ------------------------------------------------------------
// WELCOME MESSAGE (NO DMs)
// ------------------------------------------------------------
client.on("guildMemberAdd", member => {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) {
        console.log("⚠️ Welcome channel not found.");
        return;
    }

    channel.send(
        `👋 **Welcome ${member.user.username}!**\n` +
        `Please read the rules and choose a battalion to join!`
    );
});

// ------------------------------------------------------------
// PREFIX COMMANDS
// ------------------------------------------------------------
client.on("messageCreate", async msg => {
    if (msg.author.bot) return;
    if (checkSpam(msg)) return;

    if (!msg.content.startsWith(PREFIX)) return;

    const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    if (!msg.member.roles.cache.some(r => r.name === FOUNDER_ROLE))
        return msg.reply("❌ Founder only.");

    if (cmd === "ban") {
        const m = msg.mentions.members.first();
        if (!m) return msg.reply("Mention someone.");
        await m.ban();
        msg.reply(`🔨 Banned **${m.user.tag}**`);
    }

    if (cmd === "kick") {
        const m = msg.mentions.members.first();
        if (!m) return msg.reply("Mention someone.");
        await m.kick();
        msg.reply(`👢 Kicked **${m.user.tag}**`);
    }

    if (cmd === "mute") {
        const m = msg.mentions.members.first();
        if (!m) return msg.reply("Mention someone.");
        const role = msg.guild.roles.cache.find(r => r.name === "Muted");
        if (!role) return msg.reply("No Muted role found.");
        await m.roles.add(role);
        msg.reply(`🤐 Muted **${m.user.tag}**`);
    }

    if (cmd === "clear") {
        const n = parseInt(args[0]);
        if (!n) return msg.reply("Specify number.");
        await msg.channel.bulkDelete(n, true);
        msg.reply(`🧹 Deleted ${n} messages.`)
            .then(m => setTimeout(() => m.delete(), 3000));
    }
});

// ------------------------------------------------------------
// LOGIN
// ------------------------------------------------------------
client.login(process.env.TOKEN);


