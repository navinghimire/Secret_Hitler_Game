var constant = require('./constants');
const {makeid} = require('./utils');
const {Game, Player} = require('./game');
const { FASCIST, POWER_EXAMINE_MEMBERSHIP, POWER_EXAMINE_TOP_3, POWER_KILL, POWER_KILL_VETO, POWER_PICK_PRESIDENT } = require('./constants');
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
        // console.log(`Room created with id ${roomId} (${this.numRooms}) by client ${socket.id}`);
        socket.join(roomId);
        socket.emit('gamecode', roomId);
        socket.emit('once',roomId);
        // console.log(this.io.sockets.adapter.rooms);
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
        // console.log(`${alias} has joined the room ${roomId} (${this.numRooms}) with id ${socket.id}`);
        // console.log(this.io.sockets.adapter.rooms);        socket.join(roomId);
        this.clientRooms[socket.id] = roomId;
        socket.emit('gamecode', roomId);
        // console.log(`${alias} has joined the room ${roomId}
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
        
        
        
        // console.log(game.activePlayers);
        if(game.numActivePlayer >= constant.MIN_PLAYERS && game.numActivePlayer <= constant.MAX_PLAYERS) {
            this.io.to(game.host).emit('canstart');
        } else {
            this.io.to(game.host).emit('cannotstart');
        }
        this.emitGameState(roomId);
        this.io.in(roomId).emit('playerjoined', JSON.stringify(player));
    }
    handleStartGame(socket) {
        let roomId = this.clientRooms[socket.id];
        if(this.doesRoomExists(roomId)) {
            let game = this.games[roomId];
            if (socket.id !== this.host) {
                this.io.in(roomId).to(socket.id).emit('unauthorized');
            }
            if (socket.id === game.host) {
                // game.session = constant.SESSION_INIT;
                this.startGame(socket);
            }
        }
    }

    handleChancellorChosen(socket, playerId) {
        let roomId = this.clientRooms[socket.id];
        let game = this.games[roomId];
        let player = game.getPlayerById(playerId);
        if (socket.id != game.president.id) return;
        if (player) {
            game.chancellorElect = player;
            game.holdElectionPrimary();
            this.emitGameState(roomId);
            game.session = constant.SESSION_ELECTION_GENERAL;
            this.io.to(roomId).emit('vote_chancellor');
        }
        
    }

    handleCardChoosen(socket,cardType) {
        let roomId = this.clientRooms[socket.id];
        let game = this.games[roomId];
        this.legislationPresident(socket,cardType);
        game.session = constant.SESSION_LEGISLATION_CHANCELLOR;
        this.emitGameState(roomId);
        this.io.in(roomId).emit('card_discarded_president');

    }
    handleCardChoosenChancellor(socket,cardType) {
        let roomId = this.clientRooms[socket.id];
        let game = this.games[roomId];
        this.legislationChancellor(socket,cardType);
        this.emitGameState(roomId);
    }
    legislationChancellor(socket, cardToDiscard) {
        let roomId = this.clientRooms[socket.id];
        let game = this.games[roomId];
        game.holdLegislationChancellor(cardToDiscard);
        this.io.to(roomId).emit('policypassed',game.policyToPass);
        this.emitGameState(roomId);

        if(game.winner) {
            game.session = constant.SESSION_OVER;
            this.io.in(roomId).emit('gameover',JSON.stringify(game.winner));
            return;
        }


        let powers = game.powers;
        let powerid = game.fasPolicyCount;
        if (game.policyToPass === FASCIST && powerid in powers) {
          
            // console.log(powers);
            // console.log(game.fasPolicyCount);
            // console.log(game.policyToPass);
            // console.log(POWER_EXAMINE_MEMBERSHIP);

            let power = powers[powerid];
            console.log(power);
            if (power === POWER_EXAMINE_MEMBERSHIP) {
                let eligiblePlayers = game.activePlayers.filter(player => player.id !== game.president.id);
                // console.log(eligiblePlayers);
                this.io.to(game.president.id).emit('pick_' + POWER_EXAMINE_MEMBERSHIP, JSON.stringify(eligiblePlayers));

            } else if(power === POWER_EXAMINE_TOP_3) {
                let top3 = game.drawPile.filter((card,id) => id >= game.drawPile.length-3);
                this.io.to(game.president.id).emit(POWER_EXAMINE_TOP_3, JSON.stringify(top3));     
                setTimeout(() => {
                    game.endOfRoundHousekeeping();
                    this.emitGameState(roomId);
                    setTimeout(() => {
                        this.presidency(socket);
                    },5000);
                });

            } else if (power === POWER_KILL) {
                let eligiblePlayers = game.activePlayers.filter(player => player.id !== game.president.id);
                // console.log(eligiblePlayers);

                this.io.to(game.president.id).emit('pick_' + POWER_KILL, JSON.stringify(eligiblePlayers));               

            } else if (power === POWER_KILL_VETO) {
                let eligiblePlayers = game.activePlayers.filter(player => player.id !== game.president.id);
                // console.log(eligiblePlayers);
                this.io.to(game.president.id).emit('pick_' + POWER_KILL_VETO, JSON.stringify(eligiblePlayers));        

            } else if (power === POWER_PICK_PRESIDENT) {
                let eligiblePlayers = game.activePlayers.filter(player => player.id !== game.president.id);
                // console.log(eligiblePlayers);
                this.io.to(game.president.id).emit('pick_' + POWER_PICK_PRESIDENT, JSON.stringify(eligiblePlayers));
                
            } 
        } else {
            game.endOfRoundHousekeeping();
            this.emitGameState(roomId);
            setTimeout(() => {
                this.presidency(socket);
            },3000);
        }

    }
    handleVeto(socket) {
        let roomId = this.clientRooms[socket.id];
        let game = this.games[roomId];
        // let player = game.getPlayerById(socket.id);
        if (!game) return;
        if (!game.chancellor || (socket.id !== game.chancellor.id)) {
            return;
        }

        this.io.to(game.president.id).emit('veto');


    }
    handleVetoPresident(socket,verdict) {
        let roomId = this.clientRooms[socket.id];
        let game = this.games[roomId];
        let player = game.getPlayerById(socket.id);

        if (!game.president || (socket.id !== game.president.id)) {
            return;
        }
        if (verdict === 'yes') {
            this.io.to(game.chancellor.id).emit('veto_verdict','yes');
            console.log(...game.drawn);
            game.drawn.forEach(card => game.discardOne(card, game.drawn));


            game.endOfRoundHousekeeping();
            this.emitGameState(roomId);
            setTimeout(() => {
                this.presidency(socket);
            },3000);
        } else {
            this.io.to(game.chancellor.id).emit('veto_verdict','no');
        }

    }

    handlePower(socket, playerid, power) {
        console.log('power');
        console.log(power);
        let roomId = this.clientRooms[socket.id];
        let game = this.games[roomId];
        let player = game.getPlayerById(playerid);
        if (power === POWER_EXAMINE_MEMBERSHIP) {
            let roles = {};
            let fas = game.fascists.map(player => player.id).filter(pid => pid === playerid);
            if (fas.length > 0) {
                roles[playerid] = 'fascist';
            } else {
                roles[playerid] = 'liberal';
            }
            this.io.to(game.president.id).emit(POWER_EXAMINE_MEMBERSHIP, JSON.stringify(roles));
        } else if ( power === POWER_KILL) {
            this.io.in(roomId).emit(POWER_KILL, JSON.stringify(player));
            game.removePlayer(player);
            if(player.id === game.hitler.id) {
                this.emitGameState(roomId);
                this.io.in(roomId).emit('gameover',JSON.stringify(game.winner));
                return;
            }
        } else if (power === POWER_KILL_VETO) {
            game.vetoPower = true;
            this.io.in(roomId).emit(POWER_KILL_VETO, JSON.stringify(player));
            game.removePlayer(player);
            if(player.id === game.hitler.id) {
                this.emitGameState(roomId);
                this.io.in(roomId).emit('gameover',JSON.stringify(game.winner));
                return;
            }
        } else if (power === POWER_PICK_PRESIDENT) {
            console.log(player);
            game.vetoPresident = {};
            game.vetoPresident['player'] = player;
            this.io.in(roomId).emit(POWER_PICK_PRESIDENT, JSON.stringify(player));
        }
        delete game.powers[game.fasPolicyCount];
        game.endOfRoundHousekeeping();
        this.emitGameState(roomId);
        setTimeout(() => {
            this.presidency(socket);
        },3000);
    }

    handleVote(socket,vote) {
        let roomId = this.clientRooms[socket.id];
        let game = this.games[roomId];
        let playerid = game.activePlayers.map(player => player.id).filter(playerid => playerid === socket.id);
        if (playerid.length === 0) {
            return;
        }
        let player = game.getPlayerById(socket.id);
        game.castVote(player,vote);
        this.io.in(roomId).emit('voted',JSON.stringify({'player':player,'vote':vote}))
        this.emitGameState(roomId);

        if (game.hasEveryOneVoted) {
            // game.votes = {};
            this.emitGameState(roomId);
            if (game.holdElectionGeneral()) {
                if (game.session === constant.SESSION_OVER) {
                    this.emitGameState(roomId);
                    this.io.in(roomId).emit('gameover',JSON.stringify(game.winner));
                    return;
                }
                game.session = constant.SESSION_LEGISLATION_PRESIDENT;
                game.drawCards();
                this.emitGameState(roomId);
                this.io.to(game.president.id).emit('discardone', JSON.stringify(game.drawn));
            } else {
                //election has failed
                if(game.numFailedElection >= 3) {
                    game.passTopPolicyAtRandom();
                    // reset failed election
                    this.io.in(roomId).emit('randompolicy');
                    game.numFailedElection = 0;
                    game.pastCabinet.president = null;
                    game.pastCabinet.chancellor = null;                  
                }
                game.endOfRoundHousekeeping();
                this.emitGameState(roomId);
                setTimeout(() => {
                    this.presidency(socket);
                },3000);
            }
            this.io.in(roomId).emit('election_concluded');
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
            // console.log('Game already started')
            return;
        }
        if(game.canStart) {


            game.init();
            let powers = game.powers;
            this.io.emit('powers',JSON.stringify(game.powers));
            
            game.liberals.forEach(lib => {
                let roles={};
                let playerId = lib.id
                roles[playerId] = constant.LIBERAL;
                // console.log(roles);
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
        game.session = constant.SESSION_PRESIDENCY;
        game.holdPresidency();
        this.emitGameState(roomId);
        this.io.in(roomId).emit('president_choosen'); 
        game.session = constant.SESSION_ELECTION_PRIMARY;
        let eligiblePlayersForChancellorship = game.activePlayers.filter(player => game.isEligibleForChancellor(player));
        console.log(eligiblePlayersForChancellorship);
        this.io.to(game.president.id).emit('choose_chancellor',JSON.stringify(eligiblePlayersForChancellorship));
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