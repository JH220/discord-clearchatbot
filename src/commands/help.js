const Discord = require('discord.js');
const { prefix } = require('../../config.json');

module.exports = {
    name: 'help',
    description: "Sends a detailed help of the ClearChat Bot commands.",
    usage: 'help',
    execute(message, args) {
        const { commands } = message.client;

        var embed = new Discord.MessageEmbed()
            .setColor('FFFF00')
            .setTitle("ClearChat Help")
            .setDescription(`
Detailed help of the ClearChat Bot commands.

—————————————————————

**Note:**

The commands of the ClearChat bot with the prefix "cc " are outdated and are no longer maintained.
However, you can still use them, but we recommend using the interaction "/clear".

If the interactions do not exist, then the bot did not have sufficient rights when it was invited.
To fix that problem, you need to open to the [invite link](https://jh220.de/ccbot) and invite the bot again.
Important: You do not have to remove the bot from the server, it is only necessary to re-invite the bot.
Thank you for your understanding!

With kind regards
The ClearChat Bot Development Team

—————————————————————

            `);
            commands.forEach(command => embed.addField(prefix + command.usage, command.description, false));
        message.reply(embed);
    },
};