const Network = {
    hostCall: async () => {
        const socket = Network.socket

        await socket.emit("host call")
    },
    joinCall: async (callCode) => {
        const socket = Network.socket

        await socket.emit("join call", callCode)
    },
    sendMessage: async (message) => {
        const socket = Network.socket

        await socket.emit("send message", message)
    },
    initializeSocket: async () => {
        if (Network.socket) {
            return
        }

        let startModalAlreadyShowed = false

        const socket = io()

        Network.socket = socket

        socket.on("start", (permission) => {
            startModalAlreadyShowed = false
            
            UI.functions.showNameChange()

            UI.functions.hideStart()

            UI.functions.showCall()

            Network.permission = permission

            Media.initialize()

            createMediaSource()

            UI.timeElapsed = 0

            if (permission === "guest") {
                UI.functions.setCaller(UI.domCache.calleeContainer, UI.domCache.callerContainer)
            }
        })

        socket.on("call data", (callData) => {
            const callCode = callData.callCode

            Network.callCode = callCode
            Network.callData = callData

            UI.functions.updateCallData()
        })

        socket.on("send message", (messageData) => {
            UI.functions.addMessage(messageData)
        })
        socket.on("error", (errorMessage) => {
            UI.functions.modal(errorMessage)

            if (Network.callCode) {
                socket.emit("leave call")
            }
        })
        socket.on("name change", (name) => {
            Network.name = name

            if (!startModalAlreadyShowed && Network.permission == "host") {
                startModalAlreadyShowed = true

                UI.functions.modal("Share the call code shown above!")
            }
        })
        socket.on("leave call", () => {
            UI.functions.hideCall()
            UI.functions.showStart()
            // Media.functions.stopAudio()
            // Media.functions.stopVideo()

            Network.callData = null
            Network.callCode = null
            Network.name = null
        })

        socket.on("media data", (data) => {
            if (!Network.sourceBuffer || !Network.callCode) {
                return
            }

            const queue = Network.queue
            const sourceBuffer = Network.sourceBuffer

            const blob = new Blob([data], { type: 'video/webm; codecs="vp8, opus"' });
            const reader = new FileReader();
            reader.onload = () => {
                queue.push(new Uint8Array(reader.result));
                if (sourceBuffer && !sourceBuffer.updating) {
                    appendToSourceBuffer();
                }
            };
            reader.readAsArrayBuffer(blob);
        });

        socket.on("handshake", () => {
            const interval = setInterval(() => {
                if (Media.mediaRecorder) {
                    Media.mediaRecorder.start(100)

                    clearInterval(interval)
                }
            }, 250);
        })

        socket.on("end handshake", () => {
            Media.mediaRecorder.stop()
        })

        function createMediaSource() {
            const video = Network.permission === "host" ? UI.domCache.callerVideo : UI.domCache.calleeVideo

            let mediaSource = new MediaSource()
            const mediaSrc = URL.createObjectURL(mediaSource)
            video.src = mediaSrc

            let sourceBuffer
            const queue = []

            Network.queue = queue
            Network.mediaSource = mediaSource

            mediaSource.addEventListener('sourceopen', () => {
                try {
                    video.play()

                    sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8, opus"')

                    Network.sourceBuffer = sourceBuffer

                    sourceBuffer.addEventListener('updateend', () => {
                        if (queue.length > 0 && !sourceBuffer.updating) {
                            appendToSourceBuffer();
                        }
                    });
                } catch (e) {
                    console.error(e)
                }
            });
        }

        function appendToSourceBuffer() {
            const queue = Network.queue
            const sourceBuffer = Network.sourceBuffer

            try {
                if (queue.length > 0 && sourceBuffer && !sourceBuffer.updating) {
                    const chunk = queue.shift()
                    
                    sourceBuffer.appendBuffer(chunk)
                }
            } catch (e) {
                console.error(e)
            }
        }
    },
    changeName: async (name) => {
        await Network.socket.emit("name change", name)
    },
    mute: () => {
        Network.socket.emit("mute")
    },
    unmute: () => {
        Network.socket.emit("unmute")
    },
    showVideo: () => {
        Network.socket.emit("show video")
    },
    hideVideo: () => {
        Network.socket.emit("hide video")
    },
    sendMediaData: (data) => {
        Network.socket.emit("media data", data)
    },
    endCall: () => {
        Network.socket.emit("leave call")
    },
    socket: null,
    callCode: null,
    callData: null,
    name: null,
    permission: null,
    queue: null,
    sourceBuffer: null,
    mediaSource: null
}