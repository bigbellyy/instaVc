const Media = {
    initialize: async () => {
        if (Media.audioContext) {
            await Media.audioContext.close()
            
            Media.audioContext = null
        }

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        Media.audioContext = audioContext

        const constraints = {
            audio: true,
            video: { width: 1280, height: 720, facingMode: "user" }
        }
        
        const stream = await Media.functions.getMedia(constraints)

        const video = Network.permission === "host" ? UI.domCache.calleeVideo : UI.domCache.callerVideo
        video.volume = 0
        
        video.srcObject = stream

        video.oncanplay = () => {
            video.play()
        }

        //Begin sending data
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs="vp8, opus"' })
        mediaRecorder.ondataavailable = (event) => {
            if (!Network.callCode) {
                return
            }

            if (event.data.size > 0) {
                Network.sendMediaData(event.data)
            }
        }

        Media.mediaRecorder = mediaRecorder
    },
    functions: {
        getMedia: async (constraints) => {
            let stream = null

            try {
                if (Media.stream) {
                    
                    // Media.video = true
                    // Media.audio = true

                    // UI.functions.showVideo()
                    // UI.functions.unmute()
                    
                    // return Media.stream
                }

                stream = await navigator.mediaDevices.getUserMedia(constraints)

                Media.stream = stream

                Media.video = true
                Media.audio = true

                UI.functions.showVideo()
                UI.functions.unmute()

                Media.calleeAudioData = Media.functions.createCalleeAnalyser()
                UI.functions.audioBorderSelf()

                // Media.otherAudioData = Media.functions.createOtherAnalyser()
                // UI.functions.audioBorderOther()

                return stream
            }
            catch (error) {
                UI.functions.hideVideo()
                UI.functions.mute()

                UI.functions.modal("Error getting stream : " + error)
            }
        },
        createCalleeAnalyser: () => {
            const audioContext = Media.audioContext

            const source = audioContext.createMediaStreamSource(Media.stream);
            const analyser = audioContext.createAnalyser();

            source.connect(analyser);

            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            Media.calleeAnalyser = analyser

            return dataArray
        },
        createOtherAnalyser: () => {
            const audioContext = Media.audioContext

            const video = Network.permission == "host" ? UI.domCache.callerVideo : UI.domCache.calleeVideo

            if (video.sourceNode) {
                return video.dataArray
            }

            const source = audioContext.createMediaElementSource(video)
            
            const analyser = audioContext.createAnalyser()
            
            video.sourceNode = source

            source.connect(analyser)

            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount
            const dataArray = new Uint8Array(bufferLength)

            video.dataArray = dataArray

            Media.otherAnalyser = analyser

            return dataArray
        },
        stopVideo: () => {
            const stream = Media.stream

            if (!stream) {
                return
            }

            stream.getTracks().forEach((track) => {
                if (track.readyState == "live" && track.kind == "video") {
                    track.enabled = false
                }
            })

            UI.functions.hideVideo()

            Media.video = false
        },
        stopAudio: () => {
            const stream = Media.stream

            if (!stream) {
                return
            }

            stream.getTracks().forEach((track) => {
                if (track.readyState == "live" && track.kind == "audio") {
                    track.enabled = false
                }
            })

            UI.functions.mute()

            Media.audio = false
        },
        playVideo: () => {
            const stream = Media.stream

            if (!stream) {
                return
            }

            stream.getTracks().forEach((track) => {
                if (track.readyState == "live" && track.kind == "video") {
                    track.enabled = track
                }
            })

            UI.functions.showVideo()

            Media.video = true
        },
        playAudio: () => {
            const stream = Media.stream

            if (!stream) {
                return
            }

            stream.getTracks().forEach((track) => {
                if (track.readyState == "live" && track.kind == "audio") {
                    track.enabled = track
                }
            })

            UI.functions.unmute()

            Media.audio = true
        },
    },
    stream: null,
    guestStream: null,
    audio: false,
    video: false,
    calleeAnalyser: null,
    calleeAudioData: null
}