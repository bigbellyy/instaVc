const express = require("express")
const http = require("http")
const socketIo = require("socket.io")

const app = express()

const server = http.createServer(app)

const io = socketIo(server)

//Keep track of connections
const clients = {}

//Call rooms
const calls = {}

//Call code
const randomWords = [
    "apple", "beach", "cake", "duck", "eagle", "frog", "grape", "horse", "island", "juice",
    "kite", "lemon", "mouse", "notebook", "orange", "piano", "queen", "rain", "star", "tiger",
    "umbrella", "vase", "whale", "yarn", "zebra", "anchor", "bottle", "cat", "dog",
    "elephant", "flower", "glove", "hat", "ice", "jar", "key", "lamp", "moon", "nest",
    "ocean", "pencil", "quilt", "rose", "shoe", "tree", "unicorn", "violin", "window",
    "yogurt", "zoo", "ant", "boat", "cloud", "desk", "egg", "fire", "goat", "house",
    "igloo", "jam", "kite", "leaf", "mug", "net", "owl", "pot", "ring", "sock",
    "train", "umbrella", "van", "wheel", "xylophone", "yacht", "zipper", "airplane", "box", "candle",
    "door", "envelope", "fork", "globe", "hamburger", "igloo", "jacket", "kangaroo", "lion", "mountain"
  ]

const wordCount = 3

app.use(express.static("static"))

io.on("connection", (socket) => {
    try {
        onConnection(socket)
    }
    catch (error) {
        console.log(error)
    }
})

function onConnection(socket) {
    clients[socket.id] = {
        callCode: null,
        callPermissions: null,
        name: null
    }

    //Events
    socket.on("disconnect", () => {
        try {
            onLeave(socket)

            delete clients[socket.id]
        }
        catch {
            console.log("error")
        }
    })

    socket.on("media data", (data) => {
        try {
            const callCode = clients[socket.id].callCode

            if (!callCode) {
                // socket.emit("error", "error - you are not in a call")
                return
            }

            const call = calls[callCode]

            if (!call) {
                // socket.emit("error", "error - you are not in a call")
                return
            }

            const permission = clients[socket.id].callPermissions

            const guest = call.guest.socket

            if (permission === "host") {
                //emit video data to guest
                if (guest) {
                    guest.emit("media data", data)
                }
            }
            else {
                //emit video data to host
                call.host.socket.emit("media data", data)
            }
        }
        catch (error) {
            socket.emit("error", error.message)
            console.log(error)
        }
    })

    socket.on("mute", () => {
        try {
            const callCode = clients[socket.id].callCode

            if (!callCode) {
                socket.emit("error", "error - you are not in a call")
                return
            }

            calls[callCode][clients[socket.id].callPermissions].muted = true
            emitCallData(callCode)
        }
        catch (error) {
            socket.emit("error", error.message)
            console.log(error)
        }
    })

    socket.on("hide video", () => {
        try {
            const callCode = clients[socket.id].callCode

            if (!callCode) {
                socket.emit("error", "error - you are not in a call")
                return
            }

            calls[callCode][clients[socket.id].callPermissions].video = false
            emitCallData(callCode)
        }
        catch (error) {
            socket.emit("error", error.message)
            console.log(error)
        }
    })

    socket.on("unmute", () => {
        try {
            const callCode = clients[socket.id].callCode

            if (!callCode) {
                socket.emit("error", "error - you are not in a call")
                return
            }

            calls[callCode][clients[socket.id].callPermissions].muted = false
            emitCallData(callCode)
        }
        catch (error) {
            socket.emit("error", error.message)
            console.log(error)
        }
    })

    socket.on("show video", () => {
        try {
            const callCode = clients[socket.id].callCode

            if (!callCode) {
                socket.emit("error", "error - you are not in a call")
                return
            }

            calls[callCode][clients[socket.id].callPermissions].video = true
            emitCallData(callCode)
        }
        catch (error) {
            socket.emit("error", error.message)
            console.log(error)
        }
    })

    socket.on("name change", (name) => {
        try {
            if (name.length >= 30) {
                socket.emit("error", "error - name is too long")
                return
            }

            if (name.length == 0) {
                name = "null"
            }

            const callCode = clients[socket.id].callCode

            if (!callCode) {
                socket.emit("error", "error - you are not in a call")
                return
            }

            const call = calls[callCode]
            const permission = clients[socket.id].callPermissions

            clients[socket.id].name = name

            call[permission].name = name

            socket.emit("name change", name)

            emitCallData(callCode)
        }
        catch (error) {
            socket.emit("error", error.message)
            console.log(error)
        }
    })

    socket.on("leave call", () => {
        onLeave(socket)
    })

    socket.on("send message", (message) => {
        try {
            const maxMessageLength = 1000
            if (message.length > maxMessageLength) {
                socket.emit("error", "error - message is too long!")
                return
            }

            const callCode = clients[socket.id].callCode

            if (!callCode) {
                socket.emit("error", "error - you are not in a call")
                return
            }

            const call = calls[callCode]
            const guest = call.guest.socket
            const host = call.host.socket

            const messageData = {
                message: message,
                sender: clients[socket.id].name
            }

            //Message host first
            host.emit("send message", messageData)

            if (!guest) {
                return //No guest to message
            }

            guest.emit("send message", messageData)
        }
        catch (error) {
            socket.emit("error", error.message)
            console.log(error)
        }
    })

    socket.on("host call", () => {
        try {
            const callCode = getCallCode()

            calls[callCode] = {
                host: {
                    name: null,
                    muted: true,
                    video: false,
                    socket: socket
                },
                guest: {
                    name: null,
                    muted: true,
                    video: false,
                    socket: null
                }
            }

            clients[socket.id].callCode = callCode
            clients[socket.id].callPermissions = "host"

            socket.emit("start", clients[socket.id].callPermissions)

            emitCallData(callCode)
        }
        catch (error) {
            socket.emit("error", error.message)
            console.log(error)
        }
    })

    socket.on("join call", (callCode) => {
        try {
            const call = calls[callCode]

            if (!call) {
                socket.emit("error", "invalid call code")
                return
            }

            if (call.guest.socket) {
                socket.emit("error", "occupied call")
                return
            }

            call.guest.socket = socket

            clients[socket.id].callCode = callCode
            clients[socket.id].callPermissions = "guest"

            socket.emit("start", clients[socket.id].callPermissions)

            //Begin media streaming
            call.guest.socket.emit("handshake")
            call.host.socket.emit("handshake")

            emitCallData(callCode)
        }
        catch (error) {
            socket.emit("error", error.message)
            console.log(error)
        }
    })
}

function onLeave(socket) {
    const callCode = clients[socket.id].callCode

    if (!callCode) {
        socket.emit("error", "error - you are not in a call")
        return
    }

    const call = calls[callCode]
    const permission = clients[socket.id].callPermissions
    const guest = call.guest.socket
    const host = call.host.socket

    if (guest) {
        guest.emit("end handshake")
    }
    if (host) {
        host.emit("end handshake")
    }

    if (permission == "host") {
        //End call because the host left

        if (guest) {
            guest.emit("leave call")
            clients[guest.id].callCode = null
        }

        socket.emit("leave call")
        clients[socket.id].callCode = null

        delete calls[callCode]
    }
    else {
        //Guest left
        call.guest.socket = null
        call.guest.name = null
        call.guest.muted = true
        call.guest.video = false

        socket.emit("leave call")
        clients[socket.id].callCode = null

        emitCallData(callCode)
    }
}

function emitCallData(callCode) {
    const call = calls[callCode]

    const hostSocket = call.host.socket
    const guestSocket = call.guest.socket

    const hostData = {
        name: call.host.name,
        muted: call.host.muted,
        video: call.host.video
    }

    const guestData = {
        name: call.guest.name,
        muted: call.guest.muted,
        video: call.guest.video
    }

    const callData = {
        hostData: hostData,
        guestData: guestData,
        callCode: callCode
    }

    hostSocket.emit("call data", callData)

    if (guestSocket) {
        guestSocket.emit("call data", callData)
    }
}

function getCallCode() {
    let word = ""

    //Prevent copies
    do {
        word = ""

        for (let i = 0; i < wordCount; ++i) {
            const index = Math.floor(getRandomNumber(0, randomWords.length))

            const randWord = randomWords[index]

            word += randWord
        }
    } while (calls[word])

    return word
}

function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

server.listen(3000);