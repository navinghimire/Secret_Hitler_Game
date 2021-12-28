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
let vote = {};
io.on('connection',client => {
    client.emit('init');
    client.on('newgame',handleNewGame);
    client.on('joingame', handleJoinGame);
    client.on('startgame', handleStartGame);
    client.on('chancellorselected', handleChancellorSelected);
    client.on('voted', handleVoted);

    function initMode() {
        // if first game elect president at random
    }
    function electionMode() {
        // get next president
        // president elects chancellor
        // players vote on chancellor
        // if passes -> legislation mode {we have chancellor and president}
        // if failed 
            //(if failed presidency is >== 3) 
                // legislation mode involves picking a policy at random
            // otherwise
                // elect next player as president, game mode goes to election

    }
    function legislationMode() {
        // president picks 3 cards from the drawpile, discards one and gives to chancellor
        // chancellor discards one and passes the remaing policy
        // game goes to election mode until winner or loser
    }
    


    function handleVoted(res) {
        res = JSON.parse(res);
        console.log(res);
        // if (isValidRoom(gameRooms[client.id])) {
        //     return;
        // }

        let roomId = gameRooms[client.id];
        let state = gameStates[roomId];
        
        if (res === 'yes') {
            state.votes[client.id] = res; 
        } else {
            state.votes[client.id] = 'no';
        }
        io.in(roomId).emit('someonevoted' , JSON.stringify(state.votes));

        console.log(state.votes);
        if (state.hasEveryOneVoted()){
            io.in(roomId).emit('everyonevoted');
            if(state.isChancellorElected()) {
                console.log('yay');
                console.log(state.chancellor_elect);
                state.electChancellor(state.chancellor_elect);
                io.in(roomId).emit('chancellorelected', JSON.stringify(state.chancellor));

            } else {
                state.votes = {}
                state.failed_presidency += 1;
                io.in(roomId).emit('failedpresidency');
                state.electPresident(state.nextPresident);
                io.in(roomId).emit('presidentpicked', JSON.stringify(state.president));
                io.to(state.president.id).emit('pickchancellor');
            }
            io.to(roomId).emit('gamestate',JSON.stringify(state.gameState));
        }
    }
    function handleChancellorSelected(playerId) {
        let roomId = gameRooms[client.id];
        if (!isValidRoom(roomId)) {
            return;
        }
        let state = gameStates[roomId];
        if(!state.president) {
            return;
        }
        if(client.id !== state.president.id) {
            return;
        }
        // let everyone excep someone who selected know who the chancellor elect is
        
        state.chancellor_elect = state.getPlayerFromId(playerId);
        
        client.to(roomId).emit('chancellorpicked', JSON.stringify(state.chancellor_elect));

        console.log('chancellor elect below ')
        console.log(state.chancellor_elect);
        io.in(roomId).emit('votechancellor', JSON.stringify(state.chancellor_elect));

        let time = 10;
        const interval = setInterval(() => {
            io.in(roomId).emit('countdown',time--);
            if (time < 0) {
                clearInterval(interval);
            }
        },1000);
        setTimeout(() => {
            

        }, time*1000)

        // state.electChancelllor(state.getPlayerFromId())
    }
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
            if (state.hitler.id === player.id && state.numPlayers >= 7 ) {
                let role={};
                role[player.id] ='hitler'; 
                io.to(state.hitler.id).emit('playerrolesassigned',JSON.stringify(role));
                continue;
            }
            io.to(player.id).emit('playerrolesassigned',JSON.stringify(roles));
        }
        state.setRandomPresident();

        io.in(roomId).emit('presidentpicked', JSON.stringify(state.president));
        
        io.to(state.president.id).emit('pickchancellor');



        // president now picks the chancelor
        // give 10 seconds to do that if not (pick chancellor in random)
        //      get president 
        //      emit pickchancellor message
        //          // validate if the player can be chancellor
        // emit chancellorpicked message

       


        // states[roomName].players[randomHitlerIndex].role = 'hitler';
        // console.log(in37070


        io.to(roomId).emit('gamestate',JSON.stringify(state.gameState));
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
        client.emit('gamestate', JSON.stringify(gameStates[roomId].gameState));
        
        
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
        io.to(client.id).emit('gamecode', JSON.stringify(roomId));
        // console.log(state);
        io.to(roomId).emit('gamestate',JSON.stringify(gameStates[roomId].gameState));
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

        io.in(roomId).emit('gamestate',JSON.stringify(gameStates[roomId].gameState));
        client.to(roomId).emit('clientdisconnect',JSON.stringify(client.id));
    }

    




    client.on('disconnect', handleDisconnect);
        
    });
    
    
    io.listen(3000);