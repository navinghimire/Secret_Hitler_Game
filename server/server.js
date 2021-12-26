const {MAX_PLAYERS, MIN_PLAYERS, WAITING, IN_PROGRESS} = require('./constants');
const { on } = require('nodemon');
const { Game, Player } = require('./game');
const { makeid } = require('./utils');

// set options for cors policy
const options = {
    cors: {
        origin: "http://127.0.0.1:8080",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true
};
const io = require('socket.io')(options);

let gameStates = {};
let internalStates = {};
let gameRooms = {};
let hostID = {};
io.on('connection',client => {
    client.emit('init');
    client.on('newgame',handleNewGame);
    client.on('joingame', handleJoinGame);
    client.on('startgame', handleStartGame);

    function handleStartGame() {

        const roomId = gameRooms[client.id];
        if (client.id !== hostID[roomId]){ 
            client.emit('notallowed');
        }    
        // initialize the public state
        // initialize internal game state
        let state = gameStates[roomId];

        if (state.numPlayers < MIN_PLAYERS) {
            client.emit('notenoughplayers', MIN_PLAYERS);
            return;
        }
        state.game_state = IN_PROGRESS;
        state.setRandomPresident();
        // console.log(state);
        state.assignPlayerRoles();
        

        for(let player of state.liberals) {
            let role={};
            role[player.id] ='liberal'; 
            io.to(player.id).emit('playerrolesassigned',JSON.stringify(role));
        }
        
        // let all the fascist know who other fascists are
        let roles = {};
        for(let player of state.fascists) {
            if (state.hitler.id === player.id) {
                roles[player.id] = 'hitler';
                continue;
            }
            roles[player.id] = 'fascist';
        }
        for(let player of state.fascists) {
            if (state.hitler.id === player.id) {
                let role={};
                role[player.id] ='hitler'; 
                io.to(state.hitler.id).emit('playerrolesassigned',JSON.stringify(role));
                continue;
            }
            io.to(player.id).emit('playerrolesassigned',JSON.stringify(roles));
        }


        




        // states[roomName].players[randomHitlerIndex].role = 'hitler';
        // console.log(in37070


        io.to(roomId).emit('gamestate',state.gameState);
        io.to(roomId).emit('gamestarted');
    }

    function handleNewGame(alias) {

        
        // validate alias server side
        if (alias === '') {
            client.emit('noalias');
            return;
        }
        // set the player creating the new game as host
        
        // create a new room id
        const roomId = makeid(5);
        
        let game = new Game(roomId, client.id);
        let player = new Player(alias,null,client.id);
        game.addPlayer(player)
        let state = game.gameState;

        // console.log(game);
    
        // console.log(game.drawFromPile(3));
        // console.log(game);
    
        // map client id to the room for easy look for client's room

        gameRooms[client.id] = roomId;
        

        hostID[roomId] = client.id;
        
        // have the client join the room
        client.join(roomId);
        
        // update the state of the player 
        
        // add state to states  
        gameStates[roomId] = game;

        io.to(client.id).emit('playerid', client.id);
        
        // send the gamecode to the client
        client.emit('gamecode', roomId);
        
        // now the state of the room has changed emit the changes to the client
        client.emit('gamestate', gameStates[roomId].gameState);
        
        
        console.log('Client '+  client.id + ' created the room(' + roomId +')' );
        
       

    }
    function handleJoinGame(msg) {
        
        // console.log(io.sockets.adapter.rooms);
        const roomId = JSON.parse(msg).gameCode;
        const alias = JSON.parse(msg).alias;

        // console.log(client)
        if (!isValidRoom(roomId)) {
            // console.log(gameRooms,roomName);
            client.emit('unknownroom');
            return;
        }
        console.log(gameStates[roomId]);

        if (gameStates[roomId].game_state === IN_PROGRESS) {
            client.emit('inprogress');
            return;
        }
        if (roomId === '') {
            client.emit('noalias')
            return ;
        }
        gameStates[roomId].addPlayer(new Player(alias,null,client.id));
        gameRooms[client.id] = roomId;

        
        client.join(roomId);
        io.to(client.id).emit('playerid', client.id);
        io.to(client.id).emit('gamecode', roomId);
        // console.log(state);
        io.to(roomId).emit('gamestate',gameStates[roomId].gameState);
        client.to(roomId).emit('newplayerjoined',alias);
        // when 3rd player joins the game we know we can start the game


        console.log('Client '+  client.id + ' joined the room(' + roomId +')' );

        if (gameStates[roomId].players.length >= MIN_PLAYERS) {
            io.to(hostID[roomId]).emit('canstartgame');
        }

    }
    function isValidRoom(roomId){
        return (io.sockets.adapter.rooms.has(roomId));
    }
    function handleDisconnect() {
        let roomId = gameRooms[client.id]
        if (!isValidRoom(roomId)) {
            return;
        }
        // how do i want to handle player disconnecting
        // - need to change the state and emit change state so that browser can render the change
        
        // get the room the client was on


        gameStates[roomId].removePlayer(client.id);
        // remove current player from the game

        // console.log(gameStates[roomId]);

        io.in(roomId).emit('gamestate',gameStates[roomId].gameState);
        client.to(roomId).emit('clientdisconnect',client.id);
    }
    
    client.on('disconnect', handleDisconnect);
        
    });
    
    
    io.listen(3000);