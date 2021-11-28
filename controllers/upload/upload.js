const { Route } = require('../../core');
const jimp = require('jimp');
const path = require('path');
const fs = require('fs');
const http = require('http-status-codes'); 
const ServerError = require('../../core/lib/serverError');
const uuid = require('uuid');
const axios = require('axios').default;
const ft = require('file-type');
const MIME_TYPES = [
    "image/bmp",
    "image/jpeg",
    "image/png", 
    "image/x-ms-bmp", 
];
const COLOR_TYPES = [
    0,
    2,
    4,
    6,
]

var uploadRoute = new Route('/upload', 'post', async (req, res) => {
    try {
        var file;
        if (!req.files && !req.body.file) {
            throw new ServerError(400, "Need an image");
        }
        else if (req.body.file) {
            let resp = await axios.get(req.body.file, {responseType: 'arraybuffer'})
            .catch(e => {throw new ServerError(500, e)});
            file = {
                data: resp.data,
                name: req.body.file.split('/')[req.body.file.split('/').length-1],
                size: resp.data.length,
                mimetype: (await ft.fromBuffer(resp.data)).mime,
            }
        }
        else {
            file = req.files.file;
        }
        const resolution = +req.body.resolution || 64;
        if (resolution > 256) {
            throw new ServerError(400, "Output resolution cannot be higher than 256x256");
        }
        const colorType = +req.body.colorType || 2;
        if (!COLOR_TYPES.some(x => x == colorType)) {
            throw new ServerError(400, `ColorType must be one of ${COLOR_TYPES}`);
        }
        const posterize = +req.body.posterize || 16;
        const normalize = Boolean(req.body.normalize) && req.body.grayscale != 'false';
        const grayscale = Boolean(req.body.grayscale) && req.body.grayscale != 'false';
        if (!MIME_TYPES.some(x => x == file.mimetype)) {
           throw new ServerError(400, `Image type must be one of ${MIME_TYPES}`);
        }
        req.pipe(req.busboy);
        //TODO make better filename algo
        const filename = uuid.v4() + '.' + file.mimetype.split('/')[1];
        const filepath = path.join(__dirname, `../../${process.env.UPLOAD_FOLDER}/`, filename);

        jimp.read(file.data, (e,img) => {
            if (e)
                throw new ServerError(500, e.body);
            var onError = (e) => {if(e) throw new ServerError(500, e)}
            try {
                if (normalize) {
                    img.normalize(onError);
                }
                if (grayscale) {
                    img.grayscale(onError);
                }
                img.resize(resolution, resolution, jimp.RESIZE_NEAREST_NEIGHBOR, onError)
                .posterize(posterize, onError)
                .colorType(colorType, onError);
                //.color([{ apply: "saturate" , params:[+req.body.saturate_rate] }]) // DONT WORKS
                
            }
            catch(e)
            {
                if (e instanceof ServerError) {
                    res.append('Content-Type', 'application/json')
                    res.status(e.status).json(e.body);
                    return;
                }
                else
                    throw e;
            }
            
            img.getBuffer(file.mimetype, (e, buffer) => {
                if (e) throw new ServerError(500, e.body);
                
                fs.writeFileSync(filepath, buffer);
                res.send({
                    status: 200,
                    message: http.getReasonPhrase(200),
                    data: {
                        filename:filename,
                        url: `/${process.env.UPLOAD_FOLDER}/${filename}`,
                        mimetype: file.mimetype,
                        size: buffer.byteLength,
                        dataurl: 'data:image/png;base64,'+buffer.toString('base64'),
                    }
                })
            })
        });
    }
    catch(e) {
        if (e instanceof ServerError) {
            res.append('Content-Type', 'application/json')
            res.status(e.status).json(e.body);
        }
        else
            throw e;
    }
})
module.exports = uploadRoute;