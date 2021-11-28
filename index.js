require('dotenv').config();

process.env.ROOT 

const { Server } = require('./core/');
const controllers = require('./controllers/index.js');

var server = new Server(process.env.PORT, controllers);

server.listen((e) => {
    console.log(`LISTENING AT ${e.address}:${e.port}`);
});