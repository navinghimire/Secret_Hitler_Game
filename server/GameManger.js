var constant = require('./constants');
const {makeid} = require('./utils');
const {Game, Player} = require('./game');
const { emit } = require('nodemon');
class GameManager {
    
    constructor(io) {
        this.io = io;
        this.rooms  = new Set();
        this.sockets = {};
        this.games = {};
        this.clientRoom = {};
    }
    createRoom(socket, alias) {
        let roomId = makeid(4);
        this.rooms.add(roomId);
        this.clientRoom[socket.id] = roomId;
        console.log(`Room created with id ${roomId} (${this.numRooms}) by client ${socket.id}`);
        socket.join(roomId);
        socket.emit('gamecode', roomId);
        console.log(this.io.sockets.adapter.rooms);
        this.games[roomId] = new Game();

        let player = new Player(socket.id, alias, null);
        this.games[roomId].addPlayer(player);
        this.emitGameState(roomId);

        return roomId;
    }
    nextSession(socket){
        let roomId = this.clientRoom[socket.id];
        let game = this.games[roomId];
        let nextSession = game.nextSession;
        
        if (game.session === constant.SESSION_OVER) {
            let players = [...game.activePlayers];
            this.games[roomId] = new Game();
            this.games[roomId].activePlayers = [...players];
            this.startGame(roomId);
            return;
        }
        game.session = nextSession;
        console.log(game,nextSession);
        game.handleSession();
        this.emitGameState(roomId);
    }
    emitGameState(roomId) {
        this.io.to(roomId).emit('state', JSON.stringify(this.games[roomId].state));

    }

    joinRoom(socket,roomId, alias) {
        let game = this.games[roomId];
        socket.join(roomId);
        this.clientRoom[socket.id] = roomId;
        socket.emit('gamecode', roomId);
        console.log(`${alias} has joined the room ${roomId} (${this.numRooms}) with id ${socket.id}`);
        console.log(this.io.sockets.adapter.rooms);
        let player = new Player(socket.id, alias, null);
        game.addPlayer(player);
        socket.on('disconnect',(reason) => {
            game.removePlayer(player);
            this.emitGameState(roomId);
            let timeout = setTimeout(() => {
                game.inactivePlayers = [];
                this.emitGameState(roomId);
            },5000);
        })

        this.startGame(roomId);

        console.log(game.activePlayers);
        this.emitGameState(roomId);
    }
    startGame(roomId) {
        let game = this.games[roomId];
        if(game.canStart) {
            game.init();
            game.liberals.forEach(lib => {
                let roles={};
                let playerId = lib.id
                roles[playerId] = constant.LIBERAL;
                console.log(roles);
                this.io.to(playerId).emit('secretRoles',JSON.stringify(roles));
            });
            let roles={};
            game.fascists.forEach(fas => {
                let playerId = fas.id;
                if(playerId === game.hitler.id) {
                    roles[playerId] = 'hitler';
                    return;
                }
                roles[playerId] = constant.FASCIST;
            })
            game.liberals.forEach(lib => {
                let playerId = lib.id;
                roles[playerId] = constant.LIBERAL;
            })
            game.fascists.forEach(fas => {
                let playerId = fas.id;
                if(playerId === game.hitler.id && game.numActivePlayer >= 7){
                    roles = {};
                    roles[game.hitler.id] = 'hitler';
                    this.io.to(playerId).emit('secretRoles',JSON.stringify(roles));        
                    return;
                }  
                this.io.to(playerId).emit('secretRoles',JSON.stringify(roles));
            })
        }

    }

    doesRoomExists(roomId){
        if (this.rooms.has(roomId)) return true;
        return false;
    }
    get numRooms() {
        return this.rooms.size;
    }
  
    



}

module.exports = {GameManager};