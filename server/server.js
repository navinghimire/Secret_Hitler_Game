const {MAX_PLAYERS, MIN_PLAYERS} = require('./constants');
const { on } = require('nodemon');
const { Game, Player } = require('./game');

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

let states = {};
let internalStates = {};
let gameRooms = {};
let hostID = {};
io.on('connection',client => {
    client.emit('init');
    client.on('newgame',handleNewGame);
    client.on('joingame', handleJoinGame);
    client.on('startgame', handleStartGame);
    function handleStartGame() {

        // initialize the public state
        // initialize internal game state
        const roomName = gameRooms[client.id];
        let state = states[roomName]
        let internalState = internalStates[roomName];

        if (state.players.length < MIN_PLAYERS) {
            client.emit('notenoughplayers', MIN_PLAYERS);
            return
        }

        
        const numPlayers = states[roomName].players.length;


        let randomHitlerIndex = Math.floor(Math.random()*numPlayers);
        internalState.hitler = state.players[randomHitlerIndex];
        internalState.hitler.role = 'hitler';
        // states[roomName].players[randomHitlerIndex].role = 'hitler';
        console.log(internalState);
        


        io.to(roomName).emit('gamestate',JSON.stringify(states[roomName]))
    }

    function handleNewGame(alias) {

        let state = {
            players: [],
            num_lib_pol_passed: 0,
        num_fas_pol_passed: 0,
        draw_pile: [],
        discard_pile: [],
        failed_presidency: 0
        };
        
        let internalState = {
            hitler: null,
            liberals: [],
            fascists: [],
        };
        
        
        // validate alias server side
        if (alias === '') {
            client.emit('noalias');
            return;
        }
        // set the player creating the new game as host
        
        // create a new room id
        const roomName = makeid(5);
        
        let game = new Game(3, client.id);
        let player = new Player(alias,null,client.id);
        game.addPlayer(player)
        console.log(game);
    
        console.log(game.drawFromPile(3));
        console.log(game);
    
        // map client id to the room for easy look for client's room

        gameRooms[client.id] = roomName;
        

        hostID[roomName] = client.id;
        
        // have the client join the room
        client.join(roomName);
        
        // update the state of the player 
        
        // add state to states  
        states[roomName] = state;
        internalStates[roomName] = internalState;
        console.log(states);
        addPlayer(alias, roomName, client.id);

        
        // send the gamecode to the client
        client.emit('gamecode', roomName);
        
        // now the state of the room has changed emit the changes to the client
        client.emit('gamestate', JSON.stringify(states[roomName]));
        
        
        console.log('Client '+  client.id + ' created the room(' + roomName +')' );
        
       

    }
    function handleJoinGame(msg) {
        
        const roomName = JSON.parse(msg).gameCode;
        const alias = JSON.parse(msg).alias;
        const cID = client.id;  
        
        // console.log(client)
        if (!isValidRoom(roomName)) {
            // console.log(gameRooms,roomName);
            client.emit('unknownroom');
            return;
        }
        if (roomName === '') {
            client.emit('noalias')
            return ;
        }
        gameRooms[client.id] = roomName;
        
        client.join(roomName);
        client.emit('gamecode', roomName);
        addPlayer(alias, roomName, client.id);
        // console.log(state);
        io.to(roomName).emit('gamestate',JSON.stringify(states[roomName]))
        client.to(roomName).emit('newplayerjoined',alias);
        // when 3rd player joins the game we know we can start the game


        console.log('Client '+  client.id + ' joined the room(' + roomName +')' );

        if (states[roomName].players.length === MIN_PLAYERS) {
            io.to(hostID[roomName]).emit('canstartgame');
        }

    }
    function isValidRoom(roomName){
        console.log(io.sockets.adapter.rooms, roomName);
        return (io.sockets.adapter.rooms.has(roomName));
    }
    function handleDisconnect() {
        // how do i want to handle player disconnecting
        // - need to change the state and emit change state so that browser can render the change
        
        // get the room the client was on


        let room = gameRooms[client.id]
        
        // change the state of the game in that room
        let state = states[room];
        if (state) {
            // find the player in that state
            let removeIndex = null;
            for (let i = 0; i < state.players.length; i++) {
                if (state.players[i].id === client.id) {
                    removeIndex = i;
                }
            }
            if (removeIndex) {
                states[room].players.splice(removeIndex,1);
            }
        }


        io.in(room).emit('gamestate',JSON.stringify(states[room]))
        client.to(room).emit('clientdisconnect',client.id);
    }
    
    client.on('disconnect', handleDisconnect);
        
    });
    
    function addPlayer(alias,roomName,id) {
        // console.log(alias,roomName,states);
        states[roomName].players.push({
            id: id,
            alias: alias,
            role: null,
        })
        
    }
    function removePlayer(id) {
        
    }
    
    io.listen(3000);
    
    function initGameState() {
        return publicGameState;
    
    
}
function makeid(length) {
    const characters = '1234567890';
    const charlen = characters.length;
    let myid = ''; 
    for(let i = 0; i < length; i++) {
      myid += characters.charAt(Math.floor(Math.random()* charlen));
    }
    return myid;
}
