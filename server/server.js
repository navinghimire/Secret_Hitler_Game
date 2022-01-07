// set options for cors policy

require('./game');
require('./constants');
const options = {
    cors: {
        origin: "http://127.0.0.1:8080",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true
};
const { Server } = require('socket.io');
const { Game } = require('./game');
io = new Server(options);
io.on('connection',socket => {
    socket.emit('init', socket.id);

    
    
    socket.on('disconnect', (reason) =>{
        console.log('client disconnected ' + reason);
    });
        
    });
io.listen(3000);