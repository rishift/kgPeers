const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const socket = new WebSocket("wss://" + location.host);
const peerConn = new RTCPeerConnection();

let localStream;
let remoteStream;
let dataChannel;

socket.addEventListener("open", () => console.log("socket opened"));
socket.addEventListener("close", () => console.log("socket closed"));

//// Create
socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);

    console.log("waiting for command to create offer or answer");

    if ("event" in data) {
        if (data.event == "create") {
            console.log("recvd command to create offer");

            peerConn.createOffer().then((offer) => {
                console.log("created offer");

                peerConn.setLocalDescription(offer).then(() => {
                    console.log("set local desc as offer");

                    peerConn.addEventListener("icecandidate", (event) => {
                        if (event.candidate === null) {
                            socket.send(
                                JSON.stringify({
                                    event: "offer",
                                    offer: peerConn.localDescription.toJSON(),
                                })
                            );

                            console.log("sent offer");
                            dataChannel = peerConn.createDataChannel("data");
                            dataChannel.onmessage = (e) => console.log("rcvd via rtc" + e.data);
                            dataChannel.onopen = (e) => console.log("datachannel open");
                            dataChannel.onclose = (e) => console.log("datachannel close");

                            socket.addEventListener("message", (event) => {
                                const data = JSON.parse(event.data);

                                console.log("now waiting for answer");

                                if ("event" in data) {
                                    if (data.event == "answer") {
                                        console.log("recvd answer");

                                        peerConn.setRemoteDescription(data.answer).then(() => {
                                            console.log("set remote desc as answer");

                                            socket.send(JSON.stringify({ event: "done" }));
                                        });
                                    }
                                }
                            });
                        }
                    });
                });
            });
        } else if (data.event == "offer") {
            console.log("recvd offer");

            peerConn.setRemoteDescription(data.offer).then(() => {
                console.log("set the offer as remote desc");

                peerConn.createAnswer().then((answer) => {
                    console.log("created answer");

                    peerConn.setLocalDescription(answer).then(() => {
                        console.log("set local desc as answer");

                        peerConn.addEventListener("icecandidate", (event) => {
                            if (event.candidate === null) {
                                socket.send(
                                    JSON.stringify({
                                        event: "answer",
                                        answer: peerConn.localDescription.toJSON(),
                                    })
                                );

                                console.log("sent answer");
                            }
                        });
                    });
                });
            });
        }
    }
});

const requestMedia = () => {
    navigator.mediaDevices
        .getUserMedia({
            audio: true,
            video: true,
        })
        .then((stream) => {
            localStream = stream;
            remoteStream = new MediaStream();

            localStream.getTracks().forEach((track) => peerConn.addTrack(track, localStream));

            peerConn.addEventListener("track", (event) => {
                event.streams[0].getTracks().forEach((track) => remoteStream.addTrack(track));
            });

            localVideo.srcObject = localStream;
            remoteVideo.srcObject = remoteStream;

            peerConn.addEventListener("datachannel", (event) => {
                console.log("recvd data channel");

                dataChannel = event.channel;
                dataChannel.onmessage = (e) => console.log("rcvd via rtc" + e.data);
                dataChannel.onopen = (e) => console.log("datachannel open");
                dataChannel.onclose = (e) => console.log("datachannel close");
            });
        })
        .catch((err) => {
            console.log(err);
        });
};

// const showStreams = () => {
//     localVideo.srcObject = localStream;
//     remoteVideo.srcObject = remoteStream;
// };

const ready = () => {
    socket.send(JSON.stringify({ event: "ready" }));
};

// requestMedia()
// showStreams()
// ready()
