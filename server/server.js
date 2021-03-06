// set options for cors policy
const { FASCIST, POWER_EXAMINE_MEMBERSHIP, POWER_EXAMINE_TOP_3, POWER_KILL, POWER_KILL_VETO, POWER_PICK_PRESIDENT } = require('./constants');

require('./utils');
const options = {
    cors: {
        origin: "http://10.0.0.138:5500",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true
};
const { Server } = require('socket.io');
const constants = require('./constants');
const { Game } = require('./game');
const { GameManager } = require('./GameManger');
const { validateName } = require('./utils');
io = new Server(options);
const gameManager = new GameManager(io);
io.on('connection', socket => {
    socket.emit('init', socket.id);
    socket.on('hostGame', handleHostGame);
    socket.on('joinGame', handleJoinGame);
    socket.on('startgame', () => gameManager.handleStartGame(socket));
    socket.on('chancellor_choosen', (playerId) => gameManager.handleChancellorChosen(socket, playerId));
    socket.on('vote', vote => gameManager.handleVote(socket, vote));
    socket.on('card_choosen', cardType => gameManager.handleCardChoosen(socket, cardType));
    socket.on('card_choosen_chancellor', cardType => gameManager.handleCardChoosenChancellor(socket, cardType));
    socket.on('picked_' + POWER_EXAMINE_MEMBERSHIP, playerid => gameManager.handlePower(socket, playerid, POWER_EXAMINE_MEMBERSHIP));
    socket.on('picked_' + POWER_KILL, playerid => gameManager.handlePower(socket, playerid, POWER_KILL));
    socket.on('picked_' + POWER_KILL_VETO, playerid => gameManager.handlePower(socket, playerid, POWER_KILL_VETO));
    socket.on('picked_' + POWER_PICK_PRESIDENT, playerid => {
        console.log(playerid, POWER_PICK_PRESIDENT);
        gameManager.handlePower(socket, playerid, POWER_PICK_PRESIDENT);

    });
    socket.on('disconnect', (reason) => {});
    socket.on('veto', () => gameManager.handleVeto(socket));
    socket.on('veto_president', verdict => gameManager.handleVetoPresident(socket, verdict));

    function handleHostGame(alias) {
        alias = JSON.parse(alias);
        if (!validateName(alias)) {
            return;
        }
        const id = gameManager.createRoom(socket, alias);

    }

    function handleJoinGame(message) {
        message = JSON.parse(message);
        if (!validateName(message.alias)) return;
        if (!gameManager.doesRoomExists(message.code)) return;
        gameManager.joinRoom(socket, message.code, message.alias);
    }
});



io.listen(3000, () => console.log('Listening...'));