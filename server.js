const Koa = require('koa');
const app = new Koa();
const static = require('koa-static');
const https = require('https');
const WebSocket = require('ws');
const fs = require('fs');
const options = {
    key: fs.readFileSync('./_.youxiang.com.key'),
    cert: fs.readFileSync('./_.youxiang.com.crt')
};

app.use(static(__dirname + '/', { extensions: ['html'] }));

let server = https.createServer(options, app.callback()).listen(3002);
let wss = new WebSocket.Server({ server });

let wssArr = [];

wss.on('connection', function (currentClient, reg) {
    console.log('ws is conected！room:', reg.url);
    let room = reg.url;

    wssArr.push({ room: room, client: currentClient });
    let roomClients = wssArr.filter((item) => {
        return item.room === room;
    });
    if (roomClients.length > 2) {
        currentClient.send(JSON.stringify({ code: '-1', message: '房间已满' }));
    } else {
        roomClients.forEach((item) => {
            item.client.send(JSON.stringify({ code: '99', message: '当前房间内人员数:' + roomClients.length }));
        });
    }

    currentClient.on('message', function (data) {
        //寻找匹配的房间号
        let roomClients = wssArr.filter((item) => {
            return item.room === room;
        });

        roomClients.forEach((item) => {
            if (item.client !== currentClient) {
                item.client.send(data);
            }
        });
    });

    currentClient.on('close', function () {
        wssArr = wssArr.filter((item) => {
            return item.client !== currentClient;
        });
        console.log('ws is closed', room);
    });

});



