module.exports = {
    name: 'clear',
    description: "Clears :recycle: the message history by a specified amount of messages",
    usage: 'clear [Amount] [User]',
    permissions: 'MANAGE_MESSAGES',
    execute(message, args) {
        if(args.length < 0 || args.length > 2) return message.reply("please use: " + this.usage);

        var amount = 100;
        var user = null;

        if(args.length == 1) {
            if(!message.mentions.users.size) amount = parseInt(args[0]) + 1;
            else user = message.mentions.users.first();
        } else if(args.length == 2) {
            amount = parseInt(args[0]) + 1;
            if(!message.mentions.users.size) return message.reply("you need to tag a valid user.");
            user = message.mentions.users.first();
        }
        
        if(isNaN(amount)) return message.reply("please enter a valid number.");
        if(amount <= 1 || amount > 100) return message.reply("you need to input a number between 1 and 99.");

        message.channel.messages.fetch({ limit: amount })
            .then(fetchMessages => {
                var messages = fetchMessages.filter(message => !message.pinned);
                if(user) messages = messages.filter(message => message.author.id == user.id);

                return message.channel.bulkDelete(messages, true);
            }).then(prunedMessages => {
                const count = `${prunedMessages.size} message${prunedMessages.size != 1 ? 's' : ''}`;
                const byUser = user ? ` from ${user}` : '';
                message.channel.send(`
${message.author} deleted ${count} in this channel${byUser}.

**Note:** This command is outdated. Please use */clear*
If this doesn't exist, please read the instructions in the *cc help* command.
`);
            });
    },
};