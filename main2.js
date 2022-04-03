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
let pc = null;
let localStream = null;
let remoteStream = null;
let isCalled = false;

let localVideo = document.getElementById('localVideo');
let remoteVideo = document.getElementById('remoteVideo');

let room = '';
let user = random('USER-');
if (window.location.search.match('room=')) {
    room = window.location.search.replace('?room=', '');
}

// document.getElementById('roomid').value = room;
// document.getElementById('userid').value = user;

let socket = null;
let startWSConnect = () => {
    if (!room || !user) {
        document.getElementById('message').innerHTML = document.getElementById('message').innerHTML + '<br/>' + '请填写用户名和房间号';
        return;
    }
    socket = new WebSocket('wss://' + window.location.hostname + ':3002/' + room);
    socket.onopen = () => {
        document.getElementById('message').innerHTML = document.getElementById('message').innerHTML + '<br/>' + '成功加入房间' + room;
        socket.send(JSON.stringify({ direction: 'name', value: user }));
    };

    socket.onclose = () => {
        console.log('ws is close');
        socket = null;
    };

    socket.onmessage = (message) => {
        console.log('get message:', message.data);

        let result = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
        if (result.code === '-1') {
            alert('会议已满');
            socket.close();
            document.getElementById('startcallid').disabled = true;
            document.getElementById('endcallid').disabled = true;
            // document.getElementById('message').innerHTML = document.getElementById('message').innerHTML + '<br/>' + result.message;
            exit(true);
            return;
        }
        if (result.code === '99') {
            document.getElementById('onlineNum').innerHTML = result.result.length;
            document.getElementById('onlineUser').innerHTML = result.result.join('<br/>');
            return;
        }

        if (result.direction === 'leave') {
            exit(true);
            return;
        }

        if (result.type === 'offer') {
            isCalled = true; // 代表被叫
            pc.setRemoteDescription(new RTCSessionDescription(result)).then(() => {
                startCall();
            }).catch();
        } else if (result.type === 'answer') {
            pc.setRemoteDescription(new RTCSessionDescription(result)).then(() => {
                console.log('set remotedescription is success');
            }).catch();
        }

        // startCall()
    };
};
let createPeerConnection = () => {
    pc = new RTCPeerConnection(servers);
    pc.onicecandidate = (event) => {
        if (event && event.candidate) {
            console.log(event.candidate);
        } else {
            let data = {
                direction: 'call',
                type: pc.localDescription.type,
                sdp: pc.localDescription.sdp,
            };
            socket.send(JSON.stringify(data));
        }
    };

    pc.ontrack = (event) => {
        remoteStream = event.streams[0];
        remoteVideo.srcObject = remoteStream;
    };
};


let startCall = () => {
    document.getElementById('startcallid').disabled = true;
    document.getElementById('endcallid').disabled = false;

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


let createOfferAndAnswer = () => {
    let mediaConstraints = {
        audio: true,
        video: true
    };

    if (!isCalled) {
        pc.createOffer(mediaConstraints).then((desc) => {
            pc.setLocalDescription(new RTCSessionDescription(desc)).then(() => {
                console.log(pc.localDescription);
            }).catch();
        }).catch();
    } else {
        pc.createAnswer(mediaConstraints).then((desc) => {
            pc.setLocalDescription(new RTCSessionDescription(desc)).then(() => {
                console.log(pc.localDescription);
            }).catch();
        }).catch();
    }
};


let exit = (notNotify) => {
    if (!notNotify) {
        socket.send(JSON.stringify({ direction: 'leave', value: user }));
    }
    document.getElementById('startcallid').disabled = false;
    document.getElementById('endcallid').disabled = true;
    isCalled = false;
    document.getElementById('message').innerHTML = document.getElementById('message').innerHTML + '<br/>' + '离开房间';
    pc.close();
    pc = null;
    localVideo.src = '';
    remoteVideo.src = '';
    createPeerConnection();
};

let speaker = () => {
    remote.muted = !remote.muted;
};


startWSConnect();
createPeerConnection();
