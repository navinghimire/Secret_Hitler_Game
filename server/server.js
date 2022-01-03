// set options for cors policy
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
io = new Server(options);
io.on('connection',socket => {
    socket.emit('init', io.engine.clientsCount);
    
    
    
    socket.on('disconnect', (reason) =>{
        console.log('client disconnected ' + reason);
    });
        
    });
io.listen(3000);