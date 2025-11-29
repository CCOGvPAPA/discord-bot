// ============================================================
//  Galactic Front — Complete Discord Bot Rewrite (2025)
//  Crash-proof, CLIENT_ID-safe, Render-safe, Slash-command-safe
// ============================================================

require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    Partials,
    SlashCommandBuilder,
    Routes,
    REST,
    PermissionFlagsBits
} = require("discord.js");

// -------------------------------
// Client Setup
// -------------------------------
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

const WELCOME_CHANNEL_ID = "1443794131703959596";

// ============================================================
// Slash Commands (Defined Once)
// ============================================================

const BOT_COMMANDS = [
    new SlashCommandBuilder()
        .setName("do")
        .setDescription("AI-style natural language command")
        .addStringOption(o =>
            o.setName("instruction")
             .setDescription("Describe what you want")
             .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Open a support ticket")
];

// ============================================================
// SAFE READY EVENT (Commands Registered After Login)
// ============================================================

client.once("ready", async () => {
    console.log(`🚀 Logged in as ${client.user.tag}`);

    const CLIENT_ID = process.env.CLIENT_ID;
    const TOKEN = process.env.TOKEN;

    if (!CLIENT_ID) {
        console.error("❌ ERROR: CLIENT_ID is missing!");
        return;
    }

    try {
        const rest = new REST({ version: "10" }).setToken(TOKEN);

        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: BOT_COMMANDS }
        );

        console.log("✅ Slash Commands Registered.");
    } catch (err) {
        console.error("❌ Slash Command Error:", err);
    }
});

// ============================================================
// Welcome Message
// ============================================================

client.on("guildMemberAdd", member => {
    const ch = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!ch) return;

    ch.send(`👋 Welcome <@${member.id}> to Galactic Front Clone Wars RP!`);
});

// ============================================================
// Slash Command Handler
// ============================================================

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // ---------------------------
    // /do natural language
    // ---------------------------
    if (interaction.commandName === "do") {
        const instruction = interaction.options.getString("instruction");
        await interaction.reply({ content: `🧠 Processing: **${instruction}**`, ephemeral: true });

        handleNaturalLanguage(interaction, instruction.toLowerCase());
    }

    // ---------------------------
    // /ticket
    // ---------------------------
    if (interaction.commandName === "ticket") {
        const ticketChannel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: 0, // Text Channel
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                }
            ]
        });

        ticketChannel.send(`🎟️ Ticket created for <@${interaction.user.id}>`);
        await interaction.reply({ content: `Created: <#${ticketChannel.id}>`, ephemeral: true });
    }
});

// ============================================================
// Natural Language Handler
// ============================================================

async function handleNaturalLanguage(interaction, text) {
    const guild = interaction.guild;

    // Battalion creation
    if (text.includes("battalion")) {
        const name = text.replace("create", "").replace("battalion", "").trim();
        await guild.roles.create({ name: `${name} Battalion` });
        await guild.channels.create({ name: `${name}-battalion`, type: 4 });
        return interaction.followUp(`🛡 Created **${name} Battalion**.`);
    }

    // Role creation
    if (text.includes("create") && text.includes("role")) {
        const name = text.replace("create", "").replace("role", "").trim();
        await guild.roles.create({ name });
        return interaction.followUp(`🎖️ Role **${name}** created.`);
    }

    // Channel creation
    if (text.includes("create") && text.includes("channel")) {
        const name = text.replace("create", "").replace("channel", "").trim();
        await guild.channels.create({ name, type: 0 });
        return interaction.followUp(`📡 Channel **${name}** created.`);
    }

    return interaction.followUp("❓ I understood your request, but it's not implemented yet.");
}

// ============================================================
// Message Commands (Prefix Moderation)
// ============================================================

client.on("messageCreate", async message => {
    if (!message.guild || message.author.bot) return;

    const args = message.content.split(" ");
    const cmd = args.shift().toLowerCase();

    // ---------------------------
    // !clear
    // ---------------------------
    if (cmd === "!clear") {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages))
            return message.channel.send("❌ Missing permission: Manage Messages");

        const count = parseInt(args[0]);
        if (!count || count < 1 || count > 100)
            return message.channel.send("❌ Enter a number **1-100**");

        await message.channel.bulkDelete(count, true);
        message.channel.send(`🧹 Deleted **${count}** messages.`).catch(() => {});
    }

    // ---------------------------
    // !ban
    // ---------------------------
    if (cmd === "!ban") {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers))
            return;

        const member = message.mentions.members.first();
        if (!member) return message.channel.send("❌ Mention someone");

        member.ban();
        message.channel.send(`🔨 Banned **${member.user.tag}**`);
    }

    // ---------------------------
    // !kick
    // ---------------------------
    if (cmd === "!kick") {
        if (!message.member.permissions.has(PermissionFlagsBits.KickMembers))
            return;

        const member = message.mentions.members.first();
        if (!member) return message.channel.send("❌ Mention someone");

        member.kick();
        message.channel.send(`👢 Kicked **${member.user.tag}**`);
    }

    // ---------------------------
    // !mute
    // ---------------------------
    if (cmd === "!mute") {
        const member = message.mentions.members.first();
        if (!member) return;

        let role = message.guild.roles.cache.find(r => r.name === "Muted");
        if (!role) role = await message.guild.roles.create({ name: "Muted" });

        member.roles.add(role);
        message.channel.send(`🔇 Muted **${member.user.tag}**`);
    }
});

// ============================================================
// Login
// ============================================================

client.login(process.env.TOKEN);

