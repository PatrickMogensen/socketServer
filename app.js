const app = require('express')()
const http = require('http').createServer(app)
//require('dotenv').config()
const port = 8080
const cors = require('cors')
const bodyParser = require('body-parser')
const fetch = require('node-fetch');
app.use(bodyParser.json({ extended: true }))
app.use(cors({  // TODO check if this is still needed
    credentials: true,
    origin: true
}));

app.use((req, res, next) => {
    res.append('Access-Control-Allow-Origin', ['*']);
})
const io = require('socket.io')(http, {
    cors: {
        origin: ['*', "http://localhost:63342"],
        methods: ['GET', 'POST'],
        allowedHeaders: ['authorizationToken', 'roomId', 'email'],
        "Access-Control-Allow-Origin": '*',

    }
})
io.engine.on("initial_headers", (headers, req) => {
    headers["test"] = "123";
    headers["set-cookie"] = "mycookie=456";
});

app.set('socketIo', io)
io.engine.on("headers", (headers, req) => {
    headers["Access-Control-Allow-Origin"] = "*";
});



    let onlineUsers = []

//create promise function get wishlist

async function fetchWishlists(id) {
    const response = await fetch('https://si-authentication.azurewebsites.net/wishlists/' + id, {
        headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MzdlNzkzOTRkZTQ1NmEwZGE4YmE3NzYiLCJpYXQiOjE2NzE3MDA2NTAwOTZ9.bPx0M0QEEYTsuauRkAN_XhNwNyTCEJQuTZOuebvsp-E'
        }
    });
    return await response.json();
}

//fetchWishlists("637e849b6cbce308c1108662").then(data => console.log("fetched data:" + JSON.stringify(data)));
// add user to onlineUsers array when connected
io.on('connection', (socket) => {
    console.log('a user connected' + socket.handshake.headers.email )

    socket.on('joinroom', async (roomId) => {
        socket.join(roomId)
        console.log('joined room:' + roomId)
        const sockets = await io.in(roomId).fetchSockets();
        // creates an array of email addresses of all connected clients
        const emails = sockets.map((socket) => socket.handshake.headers.email);
        // remove duplicates
        const uniqueEmails = [...new Set(emails)];
        io.emit('online', uniqueEmails)

        fetchWishlists(roomId).then(data => {

            console.log("fetched data:" + JSON.stringify(data));
            let invites = data.invites
            if(invites){
            // remove online users from invites
            invites = invites.filter((invite) => !uniqueEmails.includes(invite.email));

            // get invites where status is accepted
            const acceptedInvites = invites.filter(invite => invite.status === 'accepted')
            // get emails of accepted invites
            if(acceptedInvites.length > 0) {
                const acceptedEmails = acceptedInvites.map(invite => invite.email)
                console.log("wtf man")

                console.log("accepted emails: " + acceptedEmails)

                // get invites where status is pending
                const pendingInvites = invites.filter(invite => invite.status === 'pending')
                if (pendingInvites.length > 0) {
                    // get emails of pending invites
                    const pendingEmails = pendingInvites.map(invite => invite.email)
                    console.log(pendingEmails)



                    socket.emit('offline', acceptedEmails);
                    socket.emit('invited', pendingEmails);
                }
            }
            }

        })
        //console.log(sockets[0].handshake.headers.email);

    })

    socket.on('disconnect', async () => {
        console.log('user disconnected')

        const sockets = await io.in("room1").fetchSockets();
        // creates an array of email addresses of all connected clients
        const emails = sockets.map((socket) => socket.handshake.headers.email);
        // remove duplicates
        const uniqueEmails = [...new Set(emails)];
        io.emit('online', uniqueEmails)

    })

    socket.on('refresh', () => {
        socket.to(socket.id).emit('online', onlineUsers)
    })


})

http.listen(port, function () {
    console.log('listening on *:4000')
})





