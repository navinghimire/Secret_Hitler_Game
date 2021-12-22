const {MAX_PLAYERS, MIN_PLAYERS} = require('./constants');
const { on } = require('nodemon');

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
let gameRooms = {};
let hostID = {};
io.on('connection',client => {
    client.emit('init');
    client.on('newgame',handleNewGame);
    client.on('joingame', handleJoinGame);
    client.on('gamestarted', handleStartGame);
    function handleStartGame() {
        // initialize the public state
        // initialize internal game state
        
    }

    function handleNewGame(alias) {
        
        // validate alias server side
        if (alias === '') {
            client.emit('noalias');
            return;
        }
        // set the player creating the new game as host

        // create a new room id
        const roomName = makeid(5);
        
        // map client id to the room

        gameRooms[client.id] = roomName;
        

        hostID[roomName] = client.id;
        
        // have the client join the room
        client.join(roomName);
        
        // update the state of the player 
        
        // add state to states  
        states[roomName] = initGameState();
        
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
        if (!isValidRoom) {
            console.log(gameRooms,roomName);
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
        
        // when 3rd player joins the game we know we can start the game


        console.log('Client '+  client.id + ' joined the room(' + roomName +')' );

        if (states[roomName].players.length === MIN_PLAYERS) {
            io.to(hostID[roomName]).emit('canstartgame');
        }

    }

    function isValidRoom(roomName){
        return (roomName in io.sockets.adapter.rooms)
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
        return {
            players: [
                // {
                    // id: null,
            // alias: "Navin", 
            // role: 'president',
            // },
            // {
            // alias: "Dhwani", 
            // role: null,
            // },
                
            // {
            // alias: "Sunada", 
            // role: 'chancellor',
            // },
    
        ],
        num_lib_pol_passed: 2,
        num_fas_pol_passed: 2,
        draw_pile: [],
        discard_pile: [],
        failed_presidency: 1
    }
    
    
    
}


const internal_state = {
    hitler: {alias:null,role:null,},
    liberals: [],
    fascists: [],
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
