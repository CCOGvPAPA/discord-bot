// bot.js
const { Client, GatewayIntentBits, Partials } = require("discord.js");
require("dotenv").config();

const PREFIX = "!";
const FOUNDER_ROLE = "Founder"; // Change if needed

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel]
});

// --- WELCOME MESSAGE ---
client.on("guildMemberAdd", (member) => {
    const channel = member.guild.systemChannel;
    if (!channel) return;

    channel.send(
        `👋 Welcome **${member.user.username}** to **Galactic Front Clone Wars RP**!\n` +
        `To get started, consider joining one of our battalions:\n\n` +
        `• **501st Legion** – Frontline infantry\n` +
        `• **212th Attack Battalion** – Heavy support\n` +
        `• **91st Mobile Recon** – Scouts & recon\n` +
        `• **Coruscant Guard** – Military police\n` +
        `• **21st Nova Corps** – Shock troopers\n\n` +
        `If you need help, ping staff!`
    );
});

// --- COMMAND HANDLER ---
client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;
    if (!msg.content.startsWith(PREFIX)) return;

    if (!msg.member.roles.cache.some(r => r.name === FOUNDER_ROLE)) {
        return msg.reply("❌ Only Founders can use bot commands.");
    }

    const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // BAN
    if (command === "ban") {
        const member = msg.mentions.members.first();
        if (!member) return msg.reply("Mention someone to ban.");

        const reason = args.join(" ") || "No reason provided";
        await member.ban({ reason });
        msg.reply(`🔨 Banned **${member.user.tag}** | ${reason}`);
    }

    // KICK
    if (command === "kick") {
        const member = msg.mentions.members.first();
        if (!member) return msg.reply("Mention someone to kick.");

        const reason = args.join(" ") || "No reason provided";
        await member.kick(reason);
        msg.reply(`👢 Kicked **${member.user.tag}** | ${reason}`);
    }

    // MUTE
    if (command === "mute") {
        const member = msg.mentions.members.first();
        if (!member) return msg.reply("Mention someone to mute.");

        const muteRole = msg.guild.roles.cache.find(r => r.name === "Muted");
        if (!muteRole) return msg.reply("Muted role doesn't exist.");

        await member.roles.add(muteRole);
        msg.reply(`🤐 Muted **${member.user.tag}**`);
    }

    // UNMUTE
    if (command === "unmute") {
        const member = msg.mentions.members.first();
        if (!member) return msg.reply("Mention someone to unmute.");

        const muteRole = msg.guild.roles.cache.find(r => r.name === "Muted");
        if (!muteRole) return msg.reply("Muted role doesn't exist.");

        await member.roles.remove(muteRole);
        msg.reply(`🔊 Unmuted **${member.user.tag}**`);
    }

    // CLEAR
    if (command === "clear") {
        const amount = parseInt(args[0]);
        if (!amount) return msg.reply("Use: `!clear 20`");

        await msg.channel.bulkDelete(amount, true);
        msg.reply(`🧹 Cleared ${amount} messages.`).then(m => setTimeout(() => m.delete(), 3000));
    }
});

client.login(process.env.TOKEN);
