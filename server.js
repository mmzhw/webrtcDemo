const Koa = require('koa');
const app = new Koa();
const static = require("koa-static");
const https = require('https');
const WebSocket = require('ws');
const fs = require('fs');
const options = {
    key: fs.readFileSync('./_.youxiang.com.key'),
    cert: fs.readFileSync('./_.youxiang.com.crt')
};

app.use(static(__dirname + "/", { extensions: ['html'] }));

let server = https.createServer(options, app.callback()).listen(3002);
let wss = new WebSocket.Server({ server });

wss.on('connection', function (wsCliend) {
    console.log('ws is conected！');

    wsCliend.on('message', function (data) {
        wss.clients.forEach(function each(client) {
            if (wsCliend !== client) {
                client.send(data);
            }
        });
    });

    wsCliend.on('close', function () {
        console.log('ws is closed');
    });

});



