// =========================
// Galactic Front Discord Bot
// COMPLETE CLEAN REWRITE
// =========================

const {
    Client,
    GatewayIntentBits,
    Partials,
    SlashCommandBuilder,
    Routes,
    REST,
    PermissionFlagsBits
} = require("discord.js");

require("dotenv").config();

// -------------------------
// CREATE CLIENT
// -------------------------
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel]
});

// -------------------------
// CONSTANTS
// -------------------------
const WELCOME_CHANNEL_ID = "1443794131703959596";

// =========================
// SLASH COMMAND SETUP
// =========================

const commands = [
    new SlashCommandBuilder()
        .setName("do")
        .setDescription("AI-style natural language command executor")
        .addStringOption(o =>
            o.setName("instruction")
             .setDescription("Describe what you want the bot to do")
             .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Open a support ticket")
];

// REGISTER SLASH COMMANDS
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

// =================================================================
// CLIENT READY
// =================================================================
client.once("ready", async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);

    try {
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log("✅ Slash Commands Registered.");
    } catch (err) {
        console.error("❌ Slash Command Error:", err);
    }
});

// =================================================================
// WELCOME MESSAGE
// =================================================================
client.on("guildMemberAdd", async member => {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;

    channel.send(
        `👋 Welcome <@${member.id}> to **Galactic Front Clone Wars RP**!\n` +
        `➡️ Be sure to pick a battalion and read the rules.`
    );
});

// =================================================================
// SLASH COMMAND HANDLING
// =================================================================
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // ----------- /do ------------
    if (interaction.commandName === "do") {
        const instruction = interaction.options.getString("instruction");

        await interaction.reply({
            content: `🧠 Processing: **${instruction}**`,
            ephemeral: true
        });

        handleNaturalLanguage(interaction, instruction);
    }

    // ----------- /ticket --------
    if (interaction.commandName === "ticket") {
        const ticketChannel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: 0, // text channel
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: interaction.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory
                    ]
                }
            ]
        });

        ticketChannel.send(
            `🎟️ Ticket created for <@${interaction.user.id}>!\n` +
            `A staff member will respond shortly.`
        );

        await interaction.reply({
            content: `Your ticket has been created: <#${ticketChannel.id}>`,
            ephemeral: true
        });
    }
});

// =================================================================
// NATURAL LANGUAGE INTERPRETER
// =================================================================
async function handleNaturalLanguage(interaction, instruction) {
    instruction = instruction.toLowerCase();

    const guild = interaction.guild;

    // -------------------------------
    // CREATE BATTALION
    // -------------------------------
    if (instruction.includes("battalion")) {
        const words = instruction.split(" ");
        const index = words.indexOf("battalion");
        const name = words[index - 1] || "unit";

        const role = await guild.roles.create({ name: `${name} Battalion` });
        await guild.channels.create({
            name: `${name}-battalion`,
            type: 4 // category
        });

        return interaction.followUp(
            `🏷️ Created **${name} Battalion** role + category.`
        );
    }

    // -------------------------------
    // CREATE ROLE
    // -------------------------------
    if (instruction.includes("create") && instruction.includes("role")) {
        const name = instruction.replace("create", "").replace("role", "").trim();

        await guild.roles.create({ name: name });
        return interaction.followUp(`🎖️ Role **${name}** created.`);
    }

    // -------------------------------
    // CREATE CHANNEL
    // -------------------------------
    if (instruction.includes("create") && instruction.includes("channel")) {
        const name = instruction.replace("create", "").replace("channel", "").trim();

        await guild.channels.create({ name: name, type: 0 });
        return interaction.followUp(`📡 Channel **${name}** created.`);
    }

    // -------------------------------
    // DEFAULT RESPONSE
    // -------------------------------
    return interaction.followUp(`❓ I understood your instruction, but don't know how to execute that yet.`);
}

// =================================================================
// MESSAGE COMMANDS (PREFIX MODERATION)
// =================================================================
client.on("messageCreate", async message => {
    if (!message.guild || message.author.bot) return;

    const args = message.content.split(" ");
    const cmd = args.shift().toLowerCase();

    // ----------------------------
    // !clear
    // ----------------------------
    if (cmd === "!clear") {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.channel.send("❌ You lack **Manage Messages**.");
        }

        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount < 1 || amount > 100)
            return message.channel.send("❌ Enter a number **1-100**.");

        await message.channel.bulkDelete(amount, true);
        message.channel.send(`🧹 Deleted **${amount}** messages.`)
            .catch(() => {});
    }

    // ----------------------------
    // !ban
    // ----------------------------
    if (cmd === "!ban") {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers))
            return message.channel.send("❌ You lack **Ban Members**.");

        const target = message.mentions.members.first();
        if (!target) return message.channel.send("❌ Mention a user to ban.");

        target.ban();
        message.channel.send(`🔨 Banned **${target.user.tag}**`);
    }

    // ----------------------------
    // !kick
    // ----------------------------
    if (cmd === "!kick") {
        if (!message.member.permissions.has(PermissionFlagsBits.KickMembers))
            return message.channel.send("❌ You lack **Kick Members**.");

        const target = message.mentions.members.first();
        if (!target) return message.channel.send("❌ Mention a user to kick.");

        target.kick();
        message.channel.send(`👢 Kicked **${target.user.tag}**`);
    }

    // ----------------------------
    // !mute
    // ----------------------------
    if (cmd === "!mute") {
        if (!message.member.permissions.has(PermissionFlagsBits.MuteMembers))
            return message.channel.send("❌ You lack **Mute Members**.");

        const target = message.mentions.members.first();
        if (!target) return message.channel.send("❌ Mention a user to mute.");

        let muteRole = message.guild.roles.cache.find(r => r.name === "Muted");
        if (!muteRole) {
            muteRole = await message.guild.roles.create({ name: "Muted" });
        }

        target.roles.add(muteRole);
        message.channel.send(`🔇 Muted **${target.user.tag}**`);
    }
});

// =================================================================
// LOGIN
// ========

