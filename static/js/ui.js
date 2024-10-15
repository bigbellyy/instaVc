function rgb(r, g, b) {
    return "rgb(" + r + "," + g + "," + b + ")"
}

const UI = {
    initialize: () => {
        //Create DOM Cache
        UI.domCache.messageInstance = document.getElementById("messageInstance")
        UI.domCache.callerHeader = document.getElementById("callerHeader")
        UI.domCache.callerVideo = document.getElementById("callerVideo")
        UI.domCache.calleeVideo = document.getElementById("calleeVideo")
        UI.domCache.videoSlash = document.getElementById("videoSlash")
        UI.domCache.muteSlash = document.getElementById("muteSlash")
        UI.domCache.videoButton = document.getElementById("videoButton")
        UI.domCache.muteButton = document.getElementById("muteButton")
        UI.domCache.calleeContainer = document.getElementById("calleeContainer")
        UI.domCache.callerContainer = document.getElementById("callerContainer")

        UI.domCache.messageInstance.remove()

        //Initialize start buttons
        const connectButton = document.getElementById("connectButton")
        const hostButton = document.getElementById("hostButton")

        connectButton.addEventListener("mousedown", async () => {
            const callCode = document.getElementById("connectTextBox").value

            await Network.initializeSocket()

            await Network.joinCall(callCode)

            // Media.initialize()
        })

        hostButton.addEventListener("mousedown", async () => {
            await Network.initializeSocket()

            await Network.hostCall()

            // Media.initialize()
        })

        //Name button
        const nameButton = document.getElementById("nameChangeButton")

        nameButton.addEventListener("mousedown", async () => {
            const nameTextBox = document.getElementById("nameTextBox")

            const name = nameTextBox.value

            Network.changeName(name)

            UI.functions.hideNameChange()
        })

        //Callee/caller events
        const callerContainer = document.getElementById("callerContainer")
        const calleeContainer = document.getElementById("calleeContainer")

        callerContainer.setAttribute("isBig", true)
        calleeContainer.setAttribute("isBig", false)

        callerContainer.addEventListener("mousedown", () => {
            UI.functions.setCaller(callerContainer, calleeContainer)
        })
        calleeContainer.addEventListener("mousedown", () => {
            UI.functions.setCaller(callerContainer, calleeContainer)
        })

        //Initialize control buttons
        const controlButtons = document.getElementsByClassName("controlButton")

        for (const element of controlButtons) {
            element.addEventListener("mouseenter", UI.events.controlButtons.onmouseenter)
            element.addEventListener("mouseleave", UI.events.controlButtons.onmouseleave)
            element.addEventListener("mousedown", UI.events.controlButtons.onmousedown)
        }

        //Basic buttons
        const basicButtons = document.getElementsByClassName("basicButton")

        for (const element of basicButtons) {
            element.addEventListener("mouseenter", UI.events.basicButtons.onmouseenter)
            element.addEventListener("mouseleave", UI.events.basicButtons.onmouseleave)
            element.addEventListener("mousedown", UI.events.basicButtons.onmousedown)
        }

        //Message buttons
        const messageButton = document.getElementById("messageButton")

        messageButton.addEventListener("mousedown", () => {
            UI.functions.toggleMessageContainer()
        })

        const messageCloseButton = document.getElementById("messageCloseButton")

        messageCloseButton.addEventListener("mousedown", () => {
            UI.functions.toggleMessageContainer()
        })

        const sendMessageButton = document.getElementById("sendMessageButton")
        const messageInput = document.getElementById("messageInput")

        sendMessageButton.addEventListener("mouseenter", () => {
            anime({
                targets: sendMessageButton,
                easing: UI.globalEasing,
                background: "rgba(60, 60, 60, 1)",
                duration: 250,
            })
        })
        sendMessageButton.addEventListener("mouseleave", () => {
            anime({
                targets: sendMessageButton,
                easing: UI.globalEasing,
                background: "rgba(60, 60, 60, 0)",
                duration: 250,
            })
        })

        sendMessageButton.addEventListener("mousedown", () => {
            sendMessage
        })

        let shiftIsDown = false

        document.getElementById("messageInput").addEventListener("keydown", (event) => {
            if (event.key == "Shift") {
                shiftIsDown = true
                return
            }

            if (event.key == "Enter" && !shiftIsDown) {
                event.preventDefault()

                sendMessage()
            }
        })

        document.getElementById("messageInput").addEventListener("keyup", (event) => {
            if (event.key == "Shift") {
                shiftIsDown = false
            }
        })

        function sendMessage() {
            const message = messageInput.value

            if (message.length == 0) {
                return
            }

            messageInput.value = ""

            Network.sendMessage(message)
        }

        document.getElementById("nameButton").addEventListener("mousedown", () => {
            UI.functions.showNameChange()
        })

        document.getElementById("hangButton").addEventListener("mousedown", () => {
            Network.endCall()
        })

        //modal
        document.getElementById("modalButton").addEventListener("mousedown", () => {
            const modal = document.getElementById("modal")
            modal.style.pointerEvents = "none"

            anime({
                targets: modal,
                opacity: 0,
                easing: UI.globalEasing,
                duration: 500
            })
        })

        //Update time and elapsed time
        const timeElapsed = document.getElementById("timeElapsed")
        const currentTime = document.getElementById("currentTime")

        let newTime = 0;
        setInterval(() => {
            ++newTime

            if (!Network.callCode) {
                newTime = 0
                return
            }

            const time = UI.functions.getTime()

            currentTime.innerText = time
            timeElapsed.innerText = `${(newTime)}s`
        }, 1000);

        UI.functions.render()
    },
    states: {
        message: false
    },
    events: {
        controlButtons: {
            onmouseenter: (event) => {
                const element = event.target
                const image = element.getElementsByTagName("img")[0]

                let newColor = rgb(35, 35, 35)

                if (element.id == "hangButton") {
                    newColor = rgb(150, 19, 19)
                }

                anime({
                    targets: element,
                    easing: UI.globalEasing,
                    background: newColor,
                    duration: 250,
                })

                anime({
                    targets: image,
                    easing: UI.globalEasing,
                    width: "60%",
                    duration: 250,
                })
                setTimeout(() => {
                    anime({
                        targets: image,
                        easing: UI.globalEasing,
                        width: "50%",
                        duration: 250,
                    })
                }, 250);
            },
            onmouseleave: (event) => {
                const element = event.target
                const image = element.getElementsByTagName("img")[0]

                let originalColor = rgb(50, 50, 50)

                if (element.id == "hangButton") {
                    originalColor = rgb(214, 23, 23)
                }

                anime({
                    targets: element,
                    easing: UI.globalEasing,
                    background: originalColor,
                    duration: 250
                })
            },
            onmousedown: (event) => {
                const element = event.target
                const duration = 150

                const audio = Media.audio
                const video = Media.video

                switch (element.id) {
                    case ("videoButton"):
                        if (video) {
                            Media.functions.stopVideo()
                        }
                        else {
                            Media.functions.playVideo()
                        }

                        break

                    case ("muteButton"):
                        if (audio) {
                            Media.functions.stopAudio()
                        }
                        else {
                            Media.functions.playAudio()
                        }

                        break
                }

                anime({
                    targets: element,
                    easing: UI.globalEasing,
                    width: "3.5%",
                    duration: duration
                })

                setTimeout(() => {
                    anime({
                        targets: element,
                        easing: UI.globalEasing,
                        width: "2.75%",
                        duration: duration
                    })
                }, duration);
            }
        },
        basicButtons: {
            onmouseenter: (event) => {
                const element = event.target

                const newColor = rgb(0, 0, 0)

                anime({
                    targets: element,
                    easing: UI.globalEasing,
                    background: newColor,
                    duration: 250,
                })
            },
            onmouseleave: (event) => {
                const element = event.target

                const newColor = rgb(20, 20, 20)

                anime({
                    targets: element,
                    easing: UI.globalEasing,
                    background: newColor,
                    duration: 250,
                })
            },
            onmousedown: (event) => {
                const element = event.target
            }
        }
    },
    functions: {
        toggleMessageContainer: () => {
            const messageButton = document.getElementById("messageButton")
            const messageContainer = document.getElementById("messageContainer")

            const duration = 500
            const easing = "easeOutCubic";

            const messageState = UI.states.message

            if (!messageState) {
                //Open message container

                anime({
                    targets: messageContainer,
                    easing: easing,
                    left: "0vw",
                    duration: duration,
                })

                anime({
                    targets: messageButton,
                    easing: easing,
                    left: "23.5vw",
                    duration: duration,
                })
            }
            else {
                //Close message container

                anime({
                    targets: messageContainer,
                    easing: easing,
                    left: "-20vw",
                    duration: duration,
                })

                anime({
                    targets: messageButton,
                    easing: easing,
                    left: "3.5vw",
                    duration: duration,
                })
            }

            UI.states.message = !messageState
        },
        showCall: () => {
            const call = document.getElementById("callContainer")
            call.style.display = "block"
            call.style.pointerEvents = "all"

            anime({
                targets: call,
                opacity: 1,
                easing: UI.globalEasing,
                duration: 1000
            })
        },
        showNameChange: () => {
            const nameChange = document.getElementById("nameChange")
            nameChange.style.display = "block"
            nameChange.style.pointerEvents = "all"

            anime({
                targets: nameChange,
                opacity: 1,
                easing: UI.globalEasing,
                duration: 500
            })
        },
        hideNameChange: () => {
            const nameChange = document.getElementById("nameChange")
            nameChange.style.pointerEvents = "none"

            anime({
                targets: nameChange,
                opacity: 0,
                easing: UI.globalEasing,
                duration: 500
            })
        },
        hideStart: () => {
            const start = document.getElementById("startContainer")
            start.style.pointerEvents = "none"

            anime({
                targets: start,
                opacity: 0,
                easing: UI.globalEasing,
                duration: 1000
            })
        },
        showStart: () => {
            const start = document.getElementById("startContainer")
            start.style.pointerEvents = "all"

            anime({
                targets: start,
                opacity: 1,
                easing: UI.globalEasing,
                duration: 1000
            })
        },
        hideCall: () => {
            const call = document.getElementById("callContainer")
            call.style.pointerEvents = "none"

            anime({
                targets: call,
                opacity: 0,
                easing: UI.globalEasing,
                duration: 1000
            })
        },
        updateCallData: () => {
            const callData = Network.callData

            //update headers
            const callerHeader = document.getElementById("callerHeader")
            const calleeHeader = document.getElementById("calleeHeader")
            const callDataElement = document.getElementById("callCode")

            callDataElement.innerText = callData.callCode

            callerHeader.innerText = callData.guestData.name ? callData.guestData.name : "Waiting for guest."
            calleeHeader.innerText = callData.hostData.name ? callData.hostData.name : ""

            const callerMuted = callData.guestData.muted
            const calleeMuted = callData.hostData.muted

            const callerVideo = callData.guestData.video
            const calleeVideo = callData.hostData.video

            const calleeSlash = document.getElementById("muteSlashCallee")
            const callerSlash = document.getElementById("muteSlashCaller")

            if (callerVideo) {
                UI.domCache.callerVideo.style.display = "block"
            }
            else {
                UI.domCache.callerVideo.style.display = "none"
            }

            if (calleeVideo) {
                UI.domCache.calleeVideo.style.display = "block"
            }
            else {
                UI.domCache.calleeVideo.style.display = "none"
            }

            if (calleeMuted) {
                anime({
                    targets: calleeSlash,
                    opacity: 1,
                    easing: UI.globalEasing,
                    duration: 500
                })
            }
            else {
                anime({
                    targets: calleeSlash,
                    opacity: 0,
                    easing: UI.globalEasing,
                    duration: 500
                })
            }

            if (callerMuted) {
                anime({
                    targets: callerSlash,
                    opacity: 1,
                    easing: UI.globalEasing,
                    duration: 500
                })
            }
            else {
                anime({
                    targets: callerSlash,
                    opacity: 0,
                    easing: UI.globalEasing,
                    duration: 500
                })
            }
        },
        render: (deltaTime) => {
            window.requestAnimationFrame(UI.functions.render)
            if (!Network.callCode) {
                return
            }

            const timeElapsed = UI.timeElapsed

            const sinValue = Math.sin(timeElapsed / 300)

            if (!Network.callData) {
                return
            }

            if (!Network.callData.guestData.name && timeElapsed - UI.lastDots >= 250) {
                //Waiting animation
                const callerHeader = UI.domCache["callerHeader"]

                callerHeader.innerText = "Waiting for guest." + ".".repeat(UI.waitingDotsCount)

                UI.waitingDotsCount++

                if (UI.waitingDotsCount > 2) {
                    UI.waitingDotsCount = 0
                }

                UI.lastDots = timeElapsed
            }
            UI.timeElapsed = deltaTime
        },
        setCaller: (element, otherElement) => { //big one
            const isBig = element.getAttribute("isBig")
            const duration = 500

            if (isBig != "false") {
                //Make element small, otherElement big
                element.setAttribute("isBig", false)
                otherElement.setAttribute("isBig", true)

                anime({
                    targets: [otherElement, element],
                    opacity: 0,
                    easing: UI.globalEasing,
                    duration: duration
                })

                setTimeout(() => {
                    otherElement.style.width = "60%"
                    otherElement.style.height = "70%"
                    otherElement.style.top = "50vh"
                    otherElement.style.left = "50%"
                    otherElement.style.zIndex = "1"

                    element.style.height = "11vw"
                    element.style.width = "20vw"
                    element.style.top = "85vh"
                    element.style.left = "87.5%"
                    element.style.zIndex = "2"

                    anime({
                        targets: [otherElement, element],
                        opacity: 1,
                        easing: UI.globalEasing,
                        duration: duration
                    })
                }, duration);
            }
            else {
                //Make element small, otherElement big
                element.setAttribute("isBig", true)
                otherElement.setAttribute("isBig", false)

                anime({
                    targets: [otherElement, element],
                    opacity: 0,
                    easing: UI.globalEasing,
                    duration: duration
                })

                setTimeout(() => {
                    element.style.width = "60%"
                    element.style.height = "70%"
                    element.style.top = "50vh"
                    element.style.left = "50%"
                    element.style.zIndex = "1"

                    otherElement.style.height = "11vw"
                    otherElement.style.width = "20vw"
                    otherElement.style.top = "85vh"
                    otherElement.style.left = "87.5%"
                    otherElement.style.zIndex = "2"

                    anime({
                        targets: [otherElement, element],
                        opacity: 1,
                        easing: UI.globalEasing,
                        duration: duration
                    })
                }, duration);
            }
        },
        addMessage: (messageData) => {
            if (!UI.states.message) {
                UI.functions.toggleMessageContainer()
            }

            const messageInstance = UI.domCache.messageInstance.cloneNode(true)
            const messageCenterContainer = document.getElementById("messageCenterContainer")

            messageCenterContainer.append(messageInstance)

            messageInstance.style.display = "block"

            const messageContent = messageInstance.getElementsByClassName("messageContent")[0]
            const messageName = messageInstance.getElementsByClassName("messageName")[0]
            const messageStem = messageInstance.getElementsByClassName("messageStem")[0]

            const message = messageData.message
            const sender = messageData.sender

            messageContent.innerText = message
            messageName.innerText = `${sender} | ${UI.functions.getTime()}`

            const isYou = sender == Network.name ? true : false

            const textHeight = messageContent.clientHeight

            if (isYou) {
                messageInstance.style.left = "35%"
            }
            else {
                messageInstance.style.left = "5%"
                messageStem.style.left = "-2.5%"
            }
            const messageDistance = 24
            const messageInstanceHeight = textHeight + messageDistance

            messageInstance.style.height = `${messageInstanceHeight - 8}px`

            messageInstance.style.top = `${UI.currentMessageTop}px`

            UI.currentMessageTop += messageInstanceHeight + messageDistance

            anime({
                targets: messageCenterContainer,
                top: `${-(UI.currentMessageTop)}px`,
                easing: UI.globalEasing,
                duration: 500
            })
        },
        getTime: () => {
            const date = new Date()
            let hour = date.getHours()
            let minute = date.getMinutes()

            if (minute < 10) {
                minute = `0${minute}`
            }
            if (hour == 0) {
                hour = 12
            }

            // let suffix = "AM"
            const suffix = ""

            if (hour > 13) {
                hour -= 12

                // suffix = "PM"
            }

            return `${hour}:${minute} ${suffix}`
        },
        modal: (message) => {
            const modal = document.getElementById("modal")
            modal.style.display = "block"
            modal.style.pointerEvents = "all"

            document.getElementById("modalText").innerText = message

            anime({
                targets: modal,
                opacity: 1,
                easing: UI.globalEasing,
                duration: 500
            })
        },
        mute: async () => {
            anime({
                targets: UI.domCache.muteButton,
                filter: ["invert(1)", "invert(0)"],
                easing: UI.globalEasing,
                duration: 500
            })

            anime({
                targets: UI.domCache.muteSlash,
                opacity: 1,
                easing: UI.globalEasing,
                duration: 500
            })

            Network.mute()
        },
        unmute: async () => {
            anime({
                targets: UI.domCache.muteButton,
                filter: ["invert(0)", "invert(1)"],
                easing: UI.globalEasing,
                duration: 500
            })

            anime({
                targets: UI.domCache.muteSlash,
                opacity: 0,
                easing: UI.globalEasing,
                duration: 500
            })

            Network.unmute()
        },
        showVideo: async () => {
            // UI.domCache.calleeVideo.style.display = "block"

            anime({
                targets: UI.domCache.videoButton,
                filter: ["invert(0)", "invert(1)"],
                easing: UI.globalEasing,
                duration: 500
            })

            anime({
                targets: UI.domCache.videoSlash,
                opacity: 0,
                easing: UI.globalEasing,
                duration: 500
            })

            Network.showVideo()
        },
        hideVideo: async () => {
            // UI.domCache.calleeVideo.style.display = "none"

            anime({
                targets: UI.domCache.videoButton,
                filter: ["invert(1)", "invert(0)"],
                easing: UI.globalEasing,
                duration: 500
            })

            anime({
                targets: UI.domCache.videoSlash,
                opacity: 1,
                easing: UI.globalEasing,
                duration: 500
            })

            Network.hideVideo()
        },
        audioBorderSelf: () => {
            function repeat() {
                requestAnimationFrame(repeat);

                const container = Network.permission == "host" ? UI.domCache.calleeContainer : UI.domCache.callerContainer

                const dataArray = Media.calleeAudioData
                const analyser = Media.calleeAnalyser
                const bufferLength = analyser.frequencyBinCount;

                analyser.getByteFrequencyData(dataArray);

                let sum = 0;
                for (let i = 0; i < bufferLength / 2; i++) {
                    sum += dataArray[i];
                }

                const ambient = 20

                const average = Math.min(Math.max((sum / bufferLength) - ambient, 0), 10);

                container.style.border = `solid ${average}px rgb(143, 223, 130)`
            }

            repeat();
        },
        audioBorderOther: () => {
            function repeat() {
                requestAnimationFrame(repeat);

                const container = Network.permission == "host" ? UI.domCache.callerContainer : UI.domCache.calleeContainer

                const dataArray = Media.otherAudioData
                const analyser = Media.otherAnalyser
                const bufferLength = analyser.frequencyBinCount;

                analyser.getByteFrequencyData(dataArray);

                let sum = 0;
                for (let i = 0; i < bufferLength / 2; i++) {
                    sum += dataArray[i];
                }

                const ambient = 20

                const average = Math.min(Math.max((sum / bufferLength) - ambient, 0), 10);

                container.style.border = `solid ${average}px rgb(143, 223, 130)`
            }

            repeat();
        }
    },
    globalEasing: "easeInOutCubic",
    domCache: {},
    timeElapsed: 0,
    currentMessageTop: 12,
    waitingDotsCount: 0,
    lastDots: 0
}

document.addEventListener("DOMContentLoaded", () => {
    UI.initialize()
})