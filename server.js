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

let getRoomClients = (room) => {
    return wssArr.filter((item) => {
        return item.room === room;
    });
};

wss.on('connection', function (currentClient, reg) {
    console.log('ws is conected！room:', reg.url);
    let room = reg.url;

    wssArr.push({ room: room, client: currentClient });

    if (getRoomClients(room).length > 2) {
        currentClient.send(JSON.stringify({ code: '-1', message: '房间已满' }));
    }

    currentClient.on('message', function (data) {

        let result = typeof data === 'string' ? JSON.parse(data) : data;
        if (result && result.type === 'name') {
            wssArr.forEach((i) => {
                if (i.client === currentClient){
                    i.name = result.value;
                }
            });
        }


        //寻找匹配的房间号l连接
        let roomClients = getRoomClients(room);
        console.log(roomClients.length)

        roomClients.forEach((item) => {
            item.client.send(JSON.stringify({
                code: '99',
                message: '当前房间内人员数:' + roomClients.length,
                result: roomClients.map((j) => {
                    return j.name;
                })
            }));
            if (item.client !== currentClient) {
                item.client.send(data);
            }
        });
    });

    currentClient.on('close', function () {
        wssArr = wssArr.filter((item) => {
            return item.client !== currentClient;
        });
        let roomClients = getRoomClients(room);
        roomClients.forEach((item) => {
            item.client.send(JSON.stringify({
                code: '99',
                message: '当前房间内人员数:' + roomClients.length,
                result: roomClients.map((j) => {
                    return j.name;
                })
            }));
        });
        console.log('ws is closed', room);
    });

});



