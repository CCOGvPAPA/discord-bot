const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

client.once("ready", () => {
    console.log(`Bot logged in as ${client.user.tag}`);
});

// When a new member joins
client.on("guildMemberAdd", (member) => {
    const channel = member.guild.systemChannel; // Uses the server’s default system channel

    if (!channel) return;

    channel.send(`Welcome! ${member} To **Galactic Front CWRP!**  
Make sure to check out a battalion & We Hope You Enjoy Your Stay!`);
});

client.login(process.env.TOKEN);
