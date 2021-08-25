import env from 'dotenv';
import * as SpamDetection from 'spam-detection';
import Discord from 'discord.js';
import { ILogObject, Logger } from 'tslog';
import { appendFileSync } from "fs";

env.config();

const logToTransport = (logObject: ILogObject) => {
    appendFileSync("logs.txt", `${logObject.date} : ${logObject.argumentsArray[0]} \n`);
}

const log: Logger = new Logger({
    type: 'json',
});
log.attachTransport(
    {
        silly: logToTransport,
        debug: logToTransport,
        trace: logToTransport,
        info: logToTransport,
        warn: logToTransport,
        error: logToTransport,
        fatal: logToTransport,
    },
    "info"
);

const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES] });
client.login(process.env.DISCORD_BOT_TOKEN);

client.on('ready', () => {
    // Set the client user's activity
    client.user?.setActivity('madge-jimmy.vercel.app', { type: 'PLAYING' });
});

client.on('messageCreate', message => {
    const spamDetectionResult = SpamDetection.getResults(message.content.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')).filter((x: { label: string, value: number }) => x.label === 'spam');
    if (spamDetectionResult.length > 0) {
        const spamDetectionValue = parseFloat(spamDetectionResult[0].value.toString().slice(0, 4));
        if (spamDetectionValue > 1.5 ||
            (message.content.includes('@everyone') && spamDetectionValue > 1)) {
            message.delete();
            //@ts-ignore
            log.info(`Deleted message from ${message.author.username} in ${message.guild?.name} - ${message.channel.name} : ${spamDetectionValue} : ${message.content}`);
        }
    }
});