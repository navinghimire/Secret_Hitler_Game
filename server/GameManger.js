var constant = require('./constants');
const {makeid} = require('./utils');
const {Game, Player} = require('./game');
class GameManager {
    
    constructor(io) {
        this.io = io;
        this.rooms  = new Set();
        this.sockets = {roomId: []};
    }
    createRoom(socket, alias) {
        let roomId;
        console.log('creating room');
        roomId = makeid(4);
        this.rooms.add(roomId);
        console.log(`Room created with id ${roomId} (${this.numRooms}) by client ${socket.id}`);
        socket.join(roomId);
        console.log(this.io.sockets.adapter.rooms);
        return roomId;
    }
    joinRoom(socket,roomId, alias) {
        socket.join(roomId);
        console.log(`${alias} has joined the room ${roomId} (${this.numRooms}) with id ${socket.id}`);
        console.log(this.io.sockets.adapter.rooms);

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