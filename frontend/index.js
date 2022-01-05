const socket = io('http://127.0.0.1:3000');   
socket.on('init',(id) => alert(id))

