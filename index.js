const Discord = require('discord.js');
const ytdl = require('ytdl-core-discord');
const fs = require('fs');
var ffmpeg = require('ffmpeg');
var getYoutubeTitle = require('get-youtube-title');

const client = new Discord.Client();

const token = 'removed';
const prefix = '-';
var messageRef = '';

var queue = [];
var channelArray = [];

var voiceConnection = '';

const streamOptions = {
    seek: 0,
    volume: 1
};

client.once('ready', () => {
    console.log('Spudnik Bot is online');
});

client.on('message', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    messageRef = message;

    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();
    const submitedArgs = args.shift();

    //console.log(command);
    //console.log(submitedArgs);

    if (command === 'ping') {
        message.channel.send('pong');

    } else if (command == 'play') {
        execute(messageRef, submitedArgs);
    } else if (command == 'skip') {
        skip(messageRef);
    } else if (command == 'stop' || command == 'fuckoff') {
        stop(messageRef);
    } else if (command == 'cosmonauts') {
        cosmonauts(messageRef, submitedArgs);
    } else if (command == 'text') {
        textChannels(messageRef, submitedArgs);
    } else if (command == 'voice') {
        voiceChannels(messageRef, submitedArgs);
    }
});

async function execute(message, musicArgs) {

    let songUrl = musicArgs;
    let voiceChannel = message.member.voice.channel;

    var flag = queue.some(element => element === songUrl);
    if (!flag) {
        queue.push(songUrl);
        console.log(queue);
        if (voiceChannel != null) {
            console.log("Channel exists");
            if (client.voice.connections.size > 0) {

                var songID = ytdl.getURLVideoID(queue.at(-1));
                var songTitle = getYoutubeTitle(songID, function (err, title) {
                    console.log(title);
                    if (voiceChannel != null) {
                        message.channel.send(`Successfully added **${title}** to the queue`);
                    };
                });

                console.log("Connection already exists");
            }
            else {
                try {
                    voiceConnection = await voiceChannel.join();
                    await play(message.channel, voiceConnection, voiceChannel);
                }
                catch (ex) {
                    console.log(ex);
                }
            }

            /*
            if (client.voice.connections.size > 0) {
                console.log("Connection exists");
                message.channel.send('Successfully added a song to the queue');
            }
            else {
                try {
                    const voiceConnection = await voiceChannel.join();
                    await play(message.channel, voiceConnection, voiceChannel);
                }
                catch (ex) {
                    console.log(ex);
                }
            }
            */
        }
    }
}

async function play(messageChannel, voiceConnection, voiceChannel) {

    var songID = ytdl.getURLVideoID(queue[0]);
    var songTitle = getYoutubeTitle(songID, function (err, title) {
        console.log(title);
        if (voiceChannel != null) {
            messageChannel.send(`Started playing: **${title}**`);
        };
    });

    const stream = await ytdl(queue[0],{filter:'audioonly'});
    //voiceConnection.play(stream, streamOptions);  ytdl(queue[0], {filter:'audio'})
    voiceConnection.play(await stream, {type: 'opus'});

    stream.on('end', function () {
        //console.log('Song ended');
        queue.shift();
        if (queue.length == 0) {
            voiceChannel.leave();
        }
        else {
            setTimeout(() => {
                play(messageChannel, voiceConnection, voiceChannel)
            }, 5000);
        }
    });

    voiceConnection.on('error', console.error);

};

function skip(message) {

    let voiceChannel = message.member.voice.channel;
    queue.shift();
    play(message.channel, voiceConnection, voiceChannel);

}

function stop(message) {

    queue = [];
    let voiceChannel = message.member.voice.channel;
    voiceChannel.leave();

}

function cosmonauts(message, emoji) {

    if (!message.member.hasPermission("CHANGE_NICKNAME")) return message.channel.send("You cannot use this command");
    if (!message.guild.me.hasPermission("MANAGE_NICKNAMES")) return message.channel.send("I require \'MANAGE_NICKNAMES\' permission");
    if (emoji < 1 || emoji > 1) return message.channel.send('Please use this command with a single emoji');

    const cosmonautsList = message.guild.roles.cache.get('removed').members.map(member => member);

    for (let i = 0; i < cosmonautsList.length; i++) {
        const oldNickname = cosmonautsList[i].displayName;
        let nameToArray = [...oldNickname];
        nameToArray.shift();
        nameToArray.unshift(emoji);
        nameToArray.pop();
        nameToArray.push(emoji);
        const newNickname = nameToArray.join('');
        (cosmonautsList[i]).setNickname(newNickname);
    }
}

function voiceChannels(message, emoji) {

    if (emoji < 1 || emoji > 1) return message.channel.send('Please use this command with a single emoji');

    getChannelIDs();
    for (let i = 0; i < channelArray.length; i++) {
        var channelid = channelArray[i];
        var channelType = message.guild.channels.cache.get(channelid).type;
        //console.log(channelType);
        if (channelType == 'voice') {
            let channelName = message.guild.channels.cache.get(channelid).name;
            //console.log(channelName);
            let nameToArray = [...channelName];
            nameToArray.shift();
            nameToArray.unshift(emoji);
            nameToArray.pop();
            nameToArray.push(emoji);
            const newName = nameToArray.join('');
            message.guild.channels.cache.get(channelid).setName(newName);
        }
    }
}

function textChannels(message, emoji) {

    if (emoji < 1 || emoji > 1) return message.channel.send('Please use this command with a single emoji');

    getChannelIDs(message);
    for (let i = 0; i < channelArray.length; i++) {
        var channelid = channelArray[i];
        var channelType = message.guild.channels.cache.get(channelid).type;
        //console.log(channelType);
        if (channelType == 'text') {
            let channelName = message.guild.channels.cache.get(channelid).name;
            //console.log(channelName);
            let nameToArray = [...channelName];
            nameToArray.shift();
            nameToArray.unshift(emoji);
            nameToArray.pop();
            nameToArray.push(emoji);
            const newName = nameToArray.join('');
            message.guild.channels.cache.get(channelid).setName(newName);
        }
    }
}

function getChannelIDs(fetch) {
    try {
        let channels = client.channels.cache;
        channelArray = [...channels.keys()];
    } catch (err) {
        console.log('array error')
        messageRef.channel.send('An error occoured while getting the channels.')
        console.log(err)
    }

    //console.log(channelArray);
    return channelArray;
}

client.login(token);