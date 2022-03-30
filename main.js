let servers = {
    'iceServers': [
        {
            'urls': 'stun:47.98.211.218:3478'
        },
        {
            'urls': 'turn:47.98.211.218:3478',
            'credential': 'webrtcdemo',
            'username': 'webrtcdemo'
        }
    ]
};
let pc = new RTCPeerConnection(servers);
let localStream = null;
let remoteStream = null;
let isCalled = false;

let screenPc = new RTCPeerConnection(servers);
let screenStatus = false;
let isScreened = false;

let localVideo = document.getElementById('localVideo');
localVideo.muted = true;
let remoteVideo = document.getElementById('remoteVideo');
let screenVideo = document.getElementById('screenVideo');

let room = '';
let user = random('USER-');
if (window.location.search.match('room=')) {
    room = window.location.search.replace('?room=', '');
}

document.getElementById('roomid').value = room;
document.getElementById('userid').value = user;

let socket = null;
let startWSConnect = () => {
    if (!room || !user) {
        document.getElementById('message').innerHTML = document.getElementById('message').innerHTML + '<br/>' + '请填写用户名和房间号';
        return;
    }
    socket = new WebSocket('wss://' + window.location.hostname + ':3002/' + room);

    socket.onopen = () => {
        document.getElementById('userid').disabled = true;
        document.getElementById('roomid').disabled = true;
        document.getElementById('connectid').disabled = true;
        document.getElementById('startcallid').disabled = false;
        document.getElementById('closewsid').disabled = false;
        document.getElementById('mutedid').disabled = false;
        document.getElementById('screenid').disabled = false;

        document.getElementById('message').innerHTML = document.getElementById('message').innerHTML + '<br/>' + '成功加入房间' + room;
        socket.send(JSON.stringify({ type: 'name', value: document.getElementById('userid').value }));
    };

    socket.onclose = () => {
        console.log('ws is close');
        socket = null;
    };

    socket.onmessage = (message) => {
        console.log('get message:', message.data);

        let result = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
        if (result.code === '-1') {
            document.getElementById('message').innerHTML = document.getElementById('message').innerHTML + '<br/>' + result.message;
            exit();
            return;
        }
        if (result.code === '99') {
            document.getElementById('onlineNum').innerHTML = result.result.length;
            document.getElementById('onlineUser').innerHTML = result.result.join('， ');
            return;
        }

        screenStatus = !!result.screen;
        delete result.screen;

        let temPC = screenStatus ? screenPc : pc;

        if (result.type === 'offer') {
            isCalled = true; // 代表被叫
            temPC.setRemoteDescription(new RTCSessionDescription(result)).then(() => {
                if (screenStatus) {
                    createOfferAndAnswer();
                } else {
                    startCall();
                }
            }).catch();
        } else if (result.type === 'answer') {
            temPC.setRemoteDescription(new RTCSessionDescription(result)).then(() => {
                console.log('set remotedescription is success');
            }).catch();
        }
    };
};


let startCall = () => {
    screenStatus = false;
    navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
    }).then((mediaStream) => {
        localVideo.srcObject = mediaStream;
        localStream = mediaStream;
        mediaStream.getTracks().forEach((track) => {
            pc.addTrack(track, mediaStream);
        });
        createOfferAndAnswer();
    }).catch();
};

let startScreen = () => {
    screenStatus = true;
    let mediaPar = {
        'audio': false,
        'video': {
            'mandatory': {
                'chromeMediaSource': 'screen',
                'maxWidth': 1920,
                'maxHeight': 1080
            },
            'optional': [
                {
                    'googTemporalLayeredScreencast': true
                },
                {
                    'googLeakyBucket': true
                }
            ]
        }
    };
    navigator.mediaDevices.getUserMedia(mediaPar).then((mediaStream) => {
        mediaStream.getTracks().forEach((track) => {
            screenPc.addTrack(track, mediaStream);
        });
        createOfferAndAnswer();
    }).catch();
};


let createOfferAndAnswer = () => {
    let mediaConstraints = {
        audio: true,
        video: true
    };
    let temPC = screenStatus ? screenPc : pc;

    if (!isCalled) {
        temPC.createOffer(mediaConstraints).then((desc) => {
            temPC.setLocalDescription(new RTCSessionDescription(desc)).then(() => {
                console.log(temPC.localDescription);
            }).catch();
        }).catch();
    } else {
        temPC.createAnswer(mediaConstraints).then((desc) => {
            temPC.setLocalDescription(new RTCSessionDescription(desc)).then(() => {
                console.log(temPC.localDescription);
            }).catch();
        }).catch();
    }
};

pc.onicecandidate = (event) => {
    if (event && event.candidate) {
        console.log(event.candidate);
    } else {
        let data = {
            type: pc.localDescription.type,
            sdp: pc.localDescription.sdp,
            screen: 0,
        };
        socket.send(JSON.stringify(data));
    }
};

pc.ontrack = (event) => {
    remoteStream = event.streams[0];
    remoteVideo.srcObject = remoteStream;
};

screenPc.onicecandidate = (event) => {
    if (event && event.candidate) {
        console.log(event.candidate);
    } else {
        let data = {
            type: screenPc.localDescription.type,
            sdp: screenPc.localDescription.sdp,
            screen: 1,
        };
        socket.send(JSON.stringify(data));
    }
};

screenPc.ontrack = (event) => {
    screenVideo.srcObject = event.streams[0];
};


let exit = () => {
    document.getElementById('message').innerHTML = document.getElementById('message').innerHTML + '<br/>' + '离开房间';
    document.getElementById('startcallid').disabled = true;
    document.getElementById('closewsid').disabled = true;
    document.getElementById('mutedid').disabled = true;
    document.getElementById('screenid').disabled = true;
    document.getElementById('connectid').disabled = false;
    document.getElementById('userid').disabled = false;
    document.getElementById('roomid').disabled = false;
    socket.close();
};

let speaker = () => {
    remote.muted = !remote.muted;
};


startWSConnect();
