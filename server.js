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

app.use(static(__dirname + '/html/', { extensions: ['html'] }));

let server = https.createServer(options, app.callback()).listen(3002);
let wss = new WebSocket.Server({ server });

function sendRoomPeoples () {
    let users = [];
    wss.clients.forEach((j) => {
        users.push(j.userID);
    });
    wss.clients.forEach(function (client) {
        client.send(JSON.stringify({
            code: '99',
            message: '当前房间内人员数:' + wss.clients.size,
            result: users
        }));
    });
}

wss.on('connection', function (wsClient, reg) {
    console.log('ws is conected！');
    wsClient.room = reg.url;

    wsClient.on('message', function (data) {
        let result = typeof data === 'string' ? JSON.parse(data) : data;
        if (result && result.direction === 'name') {
            console.log(result.value + '设置成功');
            wsClient.userID = result.value;
            sendRoomPeoples();
        } else {
            wss.clients.forEach(function (client) {
                if (client.room === wsClient.room && wsClient.userID !== client.userID) {
                    client.send(data);
                }
            });
        }
    });

    wsClient.on('close', function () {
        sendRoomPeoples();
        console.log('ws is closed');
    });

});



