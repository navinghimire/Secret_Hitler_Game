// set options for cors policy
require('./constants');
require('./utils');
const options = {
    cors: {
        origin: "http://10.0.0.138:8080",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true
};
const { Server } = require('socket.io');
const { Game } = require('./game');
const {GameManager} = require('./GameManger');
const { validateName } = require('./utils');
io = new Server(options);
const gameManager = new GameManager(io);
io.on('connection',socket => {
    // socket.emit('init', socket.id);
    socket.on('hostGame', handleHostGame);
    socket.on('joinGame', handleJoinGame);
    function handleHostGame(alias) {
        alias = JSON.parse(alias);
        if (!validateName(alias)) {
            return;
        }
        console.log(alias + ' connected') ;
        const id = gameManager.createRoom(socket,alias);
    
    }
    function handleJoinGame(message) {
        message = JSON.parse(message);
        if (!validateName(message.alias)) return;
        if (!gameManager.doesRoomExists(message.code)) return;
        gameManager.joinRoom(socket,message.code,message.alias);
    }

    socket.on('disconnect', (reason) =>{
        console.log('client disconnected ' + reason);
    });
        
    });

    

io.listen(3000);


