let servers = null;
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

const socket = new WebSocket('wss://' + window.location.hostname + ':3002');

socket.onopen = () => {
    console.log('ws is opened');
};

socket.onclose = () => {
    console.log('ws is close');
};

socket.onmessage = (message) => {
    console.log('get message:', message.data);
    let result = JSON.parse(message.data);

    screenStatus = !!result.screen;
    delete result.screen;

    let temPC = screenStatus ? screenPc : pc;

    if (result.type === 'offer') {
        isCalled = true; // 代表被叫
        temPC.setRemoteDescription(new RTCSessionDescription(result))
            .then(() => {
                if (screenStatus) {
                    createOfferAndAnswer();
                } else {
                    startCall();
                }
            })
            .catch();
    } else if (result.type === 'answer') {
        temPC.setRemoteDescription(new RTCSessionDescription(result))
            .then(() => {
                console.log('set remotedescription is success');
            })
            .catch();
    }
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
        "audio": false,
        "video": {
            "mandatory": {
                "chromeMediaSource": "screen",
                "maxWidth": 1920,
                "maxHeight": 1080
            },
            "optional": [
                {
                    "googTemporalLayeredScreencast": true
                },
                {
                    "googLeakyBucket": true
                }
            ]
        }
    }
    navigator.mediaDevices.getUserMedia(mediaPar).then((mediaStream) => {
        mediaStream.getTracks().forEach((track) => {
            screenPc.addTrack(track, mediaStream);
        });
        createOfferAndAnswer();
    }).catch();
}


let createOfferAndAnswer = () => {
    let mediaConstraints = {
        audio: true,
        video: true
    };
    let temPC = screenStatus ? screenPc : pc;

    if (!isCalled) {
        temPC.createOffer(mediaConstraints)
            .then((desc) => {
                temPC.setLocalDescription(new RTCSessionDescription(desc))
                    .then(() => {
                        console.log(temPC.localDescription);
                    })
                    .catch();
            })
            .catch();
    } else {
        temPC.createAnswer(mediaConstraints)
            .then((desc) => {
                temPC.setLocalDescription(new RTCSessionDescription(desc))
                    .then(() => {
                        console.log(temPC.localDescription);
                    })
                    .catch();
            })
            .catch();
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
    socket.close();
};

let speaker = () => {
    remote.muted = !remote.muted;
};


