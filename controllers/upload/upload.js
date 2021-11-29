const { Route } = require('../../core');
const jimp = require('jimp');
const path = require('path');
const fs = require('fs');
const http = require('http-status-codes'); 
const ServerError = require('../../core/lib/serverError');
const uuid = require('uuid');
const axios = require('axios').default;
const ft = require('file-type');
const ffmpeg = require('ffmpeg');
const MIME_TYPES = [ // TODO enum
    "image/bmp",
    "image/jpeg",
    "image/png", 
    "image/x-ms-bmp", 
];
const COLOR_TYPES = [ // TODO enum
    0,
    2,
    4,
    6,
]
const PALETTES = [ // TODO enum
    '2bpp',
    '3bpp',
    '6bpp',
    'NES',
    'LOSPEC-500',
    'SECAM',
    'none'
]
const BAYER_SCALES = [
    0,
    1,
    2,
    3,
    4,
    5
]
//TODO create assert class
/*Object.prototype.oneOf = function(x) {
    if (x instanceof Array)
        return x.some(item => item == this);
    return false;
}*/
var uploadRoute = new Route('/upload', 'post', async (req, res) => {
    try {
        const startTime = new Date().getTime();
        var file;
        if (!req.files && !req.body.file) {
            throw new ServerError(400, "Need an image");
        }
        else if (req.body.file) {
            let resp = await axios.get(req.body.file, {responseType: 'arraybuffer'})
            .catch(e => {throw new ServerError(500, e)});
            if (resp?.headers['content-type'].split('/')[0] != 'image')
                throw new ServerError(400, 'Need an image');
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
        const resolution = ~~req.body.resolution || 64;
        //                 ^^
        //round and convert to int
        if (resolution > 256) {
            throw new ServerError(400, "Output resolution cannot be higher than 256x256");
        }
        const colorType = ~~req.body.colorType || 2;
        if (!COLOR_TYPES.some(x => x == colorType)) {
            throw new ServerError(400, `ColorType must be one of ${COLOR_TYPES}`);
        }
        const palette = req.body.palette || '6bpp';
        if (!PALETTES.some (x => x == palette)) {
            throw new ServerError(400, `Palette must be one of ${PALETTES}`);
        }
        const bayer_scale = ~~req.body.bayer_scale || 5;
        /*if (!bayer_scale.oneOf(BAYER_SCALES)) {
            throw new ServerError(400, `bayer_scale must be one of ${BAYER_SCALES}`);
        }*/
        const posterize = ~~req.body.posterize || 16;
        const normalize = checkBoolean(req.body.normalize);
        const grayscale = checkBoolean(req.body.grayscale);
        if (!MIME_TYPES.some(x => x == file.mimetype)) {
           throw new ServerError(400, `Image type must be one of ${MIME_TYPES}`);
        }
        req.pipe(req.busboy);
        //TODO make better filename algo
        const filename = uuid.v4() + '.' + file.mimetype.split('/')[1];
        if (!fs.existsSync(path.join(__dirname, `../../${process.env.UPLOAD_FOLDER}/`))) {
            fs.mkdirSync(path.join(__dirname,`../../${process.env.UPLOAD_FOLDER}`));
        }
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

                const fileurl = `/${process.env.UPLOAD_FOLDER}/${filename}`;
                
                if (palette == 'none') {
                    fs.writeFileSync(filepath, buffer);
                    const endTime = new Date().getTime();
                    res.send({
                        status: 200,
                        message: http.getReasonPhrase(200),
                        data: {
                            filename:filename,
                            url: fileurl,
                            mimetype: file.mimetype,
                            size: buffer.byteLength,
                            dataurl: 'data:image/png;base64,'+buffer.toString('base64'),
                            elapsed: `${endTime - startTime}ms`,
                        }
                    })
                    return;
                }
                const palettepath = path.join(__dirname, `../../palettes/${palette}f.png`) // f for ffmpeg
                const outpath = path.join(__dirname, `../../${process.env.UPLOAD_FOLDER}/${filename}`);
                //const ffmpeg_cli = `ffmpeg -i "${filepath+'.temp'}" -i "${palettepath}" -lavfi paletteuse=:dither=bayer:bayer_scale=5 "${outpath}"`;
                const tempfilename = path.join(__dirname, '../../upload/'+filename+'.temp')
                fs.writeFile(tempfilename, buffer, () => {
                    new ffmpeg(tempfilename, (e, vid) => {
                        if (e)
                            throw new ServerError(500, e.message);
                        vid.addInput(`${palettepath}`);
                        vid.addCommand('-lavfi', `"paletteuse=dither=bayer:bayer_scale=${bayer_scale}"`);
                        vid.save(`"${outpath}"`)
                        .then(() => {
                            const endTime = new Date().getTime();
                            res.send({
                                status: 200,
                                message: http.getReasonPhrase(200),
                                data: {
                                    filename:filename,
                                    url: fileurl,
                                    mimetype: file.mimetype,
                                    size: buffer.byteLength,
                                    dataurl: 'data:image/png;base64,'+buffer.toString('base64'),
                                    elapsed: `${endTime - startTime}ms`,
                                }
                            });
                            fs.rm(filepath+'.temp', () => {});  
                        })
                    });
                });
               
                /*exec.exec(ffmpeg_cli, (err, out, stderr) => {
                    const endTime = new Date().getTime();
                    res.send({
                        status: 200,
                        message: http.getReasonPhrase(200),
                        data: {
                            filename:filename,
                            url: fileurl,
                            mimetype: file.mimetype,
                            size: buffer.byteLength,
                            dataurl: 'data:image/png;base64,'+buffer.toString('base64'),
                            elapsed: `${endTime - startTime}ms`,
                        }
                    })
                    fs.rm(filepath+'.temp');
                })*/
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
function checkBoolean(x) {
    if (x == 'false') {
        return false;
    }
    else if (x == 'true') {
        return true;
    }
    else if (Boolean(+x)) {
        return Boolean(+x);
    }
    else {
        return false;
    }
}
module.exports = uploadRoute;