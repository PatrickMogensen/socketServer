const app = require('express')()
const http = require('http').Server(app)
//require('dotenv').config()
const port = 4000
const cors = require('cors')
const bodyParser = require('body-parser')

app.use(bodyParser.json({ extended: true }))
app.use(cors({ origin: '*' }))

const io = require('socket.io')(http, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['authorizationToken', 'roomId', 'email']

    }
})
app.set('socketIo', io)

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

fetchWishlists("63a4218037144465ac2662a9").then(data => console.log("fetched data:" + JSON.stringify(data)));
// add user to onlineUsers array when connected
io.on('connection', (socket) => {
    console.log('a user connected' + socket.handshake.headers.email )

    socket.on('joinroom', async (roomId) => {
        socket.join(roomId)
        console.log('joined room: ', roomId)
        const sockets = await io.in(roomId).fetchSockets();
        // creates an array of email addresses of all connected clients
        const emails = sockets.map((socket) => socket.handshake.headers.email);
        // remove duplicates
        const uniqueEmails = [...new Set(emails)];
        io.emit('online', uniqueEmails)

        fetchWishlists(roomId).then(data => {
            console.log("fetched data:" + JSON.stringify(data));
            const invites = data.invites
            // get invites where status is accepted
            const acceptedInvites = invites.filter(invite => invite.status === 'accepted')


            socket.emit('offline', offline);
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





