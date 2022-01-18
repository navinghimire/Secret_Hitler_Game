var constant = require('./constants');
const {makeid} = require('./utils');
const {Game, Player} = require('./game');
class GameManager {
    
    constructor(io) {
        this.io = io;
        this.rooms  = new Set();
        this.sockets = {};
        this.games = {};
        this.clientRooms = {};
    }
    createRoom(socket, alias) {
        let roomId = makeid(4);
        this.rooms.add(roomId);
        this.clientRooms[socket.id] = roomId;
        console.log(`Room created with id ${roomId} (${this.numRooms}) by client ${socket.id}`);
        socket.join(roomId);
        socket.emit('gamecode', roomId);
        socket.emit('once',roomId);
        console.log(this.io.sockets.adapter.rooms);
        this.games[roomId] = new Game();
        this.games[roomId].host = socket.id;
        let player = new Player(socket.id, alias, null);
        this.games[roomId].addPlayer(player);
        this.emitGameState(roomId);

        return roomId;
    }
    emitGameState(roomId) {
        this.io.to(roomId).emit('state', JSON.stringify(this.games[roomId].state));
        
    }
    
    
    joinRoom(socket,roomId, alias) {
        
        
        let game = this.games[roomId];
        if (game.numActivePlayer > constant.MAX_PLAYERS) {
            socket.emit('toomanyplayers');
            return; 
        }
        if (game.session) {
            socket.emit('gameinprogress');
            return;
        }
        socket.join(roomId);
        this.clientRooms[socket.id] = roomId;
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
                clearTimeout(timeout);
            },5000);
        })
        
        
        
        console.log(game.activePlayers);
        if(game.numActivePlayer >= constant.MIN_PLAYERS && game.numActivePlayer <= constant.MAX_PLAYERS) {
            this.io.to(game.host).emit('canstart');
        } else {
            this.io.to(game.host).emit('cannotstart');
        }
        
        this.emitGameState(roomId);
    }
    handleStartGame(socket) {
        let roomId = this.clientRooms[socket.id];
        if(this.doesRoomExists(roomId)) {
            let game = this.games[roomId];
            if (socket.id !== this.host) {
                this.io.in(roomId).to(socket.id).emit('unauthorized');
            }
            if (socket.id === game.host) {
                this.startGame(socket);
            }
        }
    }

    handleChancellorChosen(socket, playerId) {
        let roomId = this.clientRooms[socket.id];
        let game = this.games[roomId];
        let player = game.getPlayerById(playerId);
        if (player) {
            game.chancellorElect = player;
            game.holdElectionPrimary();
            this.emitGameState(roomId);
            this.io.to(roomId).emit('vote_chancellor');
        }
        
    }

    handleCardChoosen(socket,cardType) {
        let roomId = this.clientRooms[socket.id];
        let game = this.games[roomId];
        this.legislationPresident(socket,cardType);

    }
    handleCardChoosenChancellor(socket,cardType) {
        let roomId = this.clientRooms[socket.id];
        let game = this.games[roomId];
        this.legislationChancellor(socket,cardType);
    }
    legislationChancellor(socket, cardToDiscard) {
        let roomId = this.clientRooms[socket.id];
        let game = this.games[roomId];
        game.holdLegislationChancellor(cardToDiscard);
        this.emitGameState(roomId);
        this.io.to(roomId).emit('policypassed');
        this.presidency(socket);
    }

    handleVote(socket,vote) {
        let roomId = this.clientRooms[socket.id];
        let game = this.games[roomId];
        let player = game.getPlayerById(socket.id);
        game.castVote(player,vote);
        this.io.in(roomId).emit('voted',JSON.stringify({'player':player,'vote':vote}))
        this.emitGameState(roomId);

        if (game.hasEveryOneVoted) {
            // game.votes = {};
            this.emitGameState(roomId);
            this.io.in(roomId).emit('election_concluded');
            if (game.holdElectionGeneral()) {
                game.drawCards();
                this.io.to(game.president.id).emit('discardone', JSON.stringify(game.drawn));
            } else {
                this.presidency(socket);
            }
            game.votes = {};
        }
    }
    legislationPresident(socket,cardToDiscard) {
        let roomId = this.clientRooms[socket.id];
        let game = this.games[roomId];
        game.holdLegislationPresident(cardToDiscard);
        this.emitGameState(roomId);

        this.io.to(game.chancellor.id).emit('discardonechancellor', JSON.stringify(game.drawn));
    }


    startGame(socket) {
        let roomId = this.clientRooms[socket.id];
        this.io.in(roomId).emit('gamecountdown');
        
        
        let game = this.games[roomId];
        if (game.session) {
            console.log('Game already started')
            return;
        }
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
            this.emitGameState(roomId);
            this.presidency(socket);

        }
    }

    presidency(socket) {
        let roomId = this.clientRooms[socket.id];
        let game = this.games[roomId];
        game.holdPresidency();
        this.emitGameState(roomId);
        this.io.in(roomId).emit('president_choosen'); 
        this.io.to(game.president.id).emit('choose_chancellor');
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