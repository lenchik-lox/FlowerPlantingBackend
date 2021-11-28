const express = require('express');
const path = require('path');
const busboy = require('connect-busboy');
const cors = require('cors');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const morgan = require('morgan');

class Server {
    constructor(port, controllers, middlewares = []) {
        this.app = express();
        //connect static public folder
        this.app.use('/', express.static(path.join(__dirname, '../../public')));

        //connect upload folder
        this.app.use('/'+process.env.UPLOAD_FOLDER, express.static(path.join(__dirname, '../../'+process.env.UPLOAD_FOLDER)));
        //connect sample folder
        this.app.use('/sample', express.static(path.join(__dirname, '../../sample/')));
        this.app.use('/palettes', express.static(path.join(__dirname, '../../palettes/')));
        
        //connect middleware
        //TODO class BaseMiddleware and do it through for() 
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({extended:true}));
        this.app.use(fileUpload({createParentPath:true}));
        this.app.use(busboy());
        this.app.use(morgan('dev'));

        //connect controllers
        if (controllers) {
            for(let controller of controllers) {
                this.app.route(controller.path)[controller.method](controller.handler);
            }
        }

        this.port = port;
    }
    listen(clb) {
        let server = this.app.listen(this.port, () => {
            clb(server.address());
        });
    }
}

module.exports = Server;
