// Michael Leon
// Introduction to Web Development
// Project 4, Problem 1: Multi-player Tic-Tac-Toe server

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Cloud hosts like Render choose the port for us in process.env.PORT.
// On your own PC it falls back to 3000.
const PORT = process.env.PORT || 3000;


let board = [
    "", "", "",
    "", "", "",
    "", "", ""
];
let currentPlayer = "X";   // X goes first
let winner = null;         // "X", "O", "tie", or null

let players = {
    X: null,
    O: null
};

// ---------- Socket.IO events ----------

io.on("connection", function (socket) {
    console.log("Client connected: " + socket.id);

    // Show the new client the current game right away
    socket.emit("state", getState());

    // A client typed a name/password and clicked "Join Game"
    socket.on("join", function (data) {
        const name = data.name.trim();
        const password = data.password;

        // Make sure both boxes were filled in
        if (name === "" || password === "") {
            socket.emit("message", "Please enter a name and password.");
            return;
        }

        // Don't let the same tab join twice
        if (getRole(socket.id) !== "Spectator") {
            socket.emit("message", "You already joined the game.");
            return;
        }

        let role = "Spectator";
        if (players.X === null) {
            players.X = { id: socket.id, name: name };
            role = "X";
        } else if (players.O === null) {
            players.O = { id: socket.id, name: name };
            role = "O";
        }

        console.log(name + " joined as " + role);
        socket.emit("joined", { name: name, role: role });
        io.emit("state", getState());   // tell everyone who is playing now
    });

    // A player clicked a square
    socket.on("move", function (index) {
        const role = getRole(socket.id);

        if (role === "Spectator") {
            socket.emit("message", "Spectators can't make moves.");
            return;
        }
        if (players.X === null || players.O === null) {
            socket.emit("message", "Waiting for a second player.");
            return;
        }
        if (winner) {
            return;   // game is over
        }
        if (role !== currentPlayer) {
            socket.emit("message", "It's not your turn.");
            return;
        }
        if (index < 0 || index > 8 || board[index] !== "") {
            return;   // bad square or square already taken
        }

        board[index] = currentPlayer;   // put "X" or "O" in the board
        winner = checkWinner();         // did someone win?

        if (!winner && isBoardFull()) {
            winner = "tie";
        }

        // Switch players if the game is still going
        if (!winner) {
            if (currentPlayer === "X") {
                currentPlayer = "O";
            } else {
                currentPlayer = "X";
            }
        }

        io.emit("state", getState());   // send the new board to everyone
    });

    // A player clicked "Reset Game"
    socket.on("reset", function () {
        if (getRole(socket.id) === "Spectator") {
            socket.emit("message", "Only players can reset the game.");
            return;
        }
        resetGame();
        io.emit("state", getState());
    });

    // A client closed the tab / left
    socket.on("disconnect", function () {
        console.log("Client disconnected: " + socket.id);
        const role = getRole(socket.id);

        // If a player left, open up their spot and start a fresh game
        if (role === "X" || role === "O") {
            players[role] = null;
            resetGame();
            io.emit("state", getState());
        }
    });
});

// ---------- Helper functions ----------

// Returns "X", "O", or "Spectator" for a socket id
function getRole(id) {
    if (players.X !== null && players.X.id === id) {
        return "X";
    }
    if (players.O !== null && players.O.id === id) {
        return "O";
    }
    return "Spectator";
}

// Everything the clients need to draw the page
function getState() {
    let xName = null;
    let oName = null;
    if (players.X !== null) {
        xName = players.X.name;
    }
    if (players.O !== null) {
        oName = players.O.name;
    }

    return {
        board: board,
        currentPlayer: currentPlayer,
        winner: winner,
        xName: xName,
        oName: oName
    };
}

// Returns "X" or "O" if that player has three in a row, otherwise null
function checkWinner() {
    //  0 | 1 | 2
    // ---+---+---
    //  3 | 4 | 5
    // ---+---+---
    //  6 | 7 | 8
    const lines = [
        [0, 1, 2],   // rows
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],   // columns
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],   // diagonals
        [2, 4, 6]
    ];

    for (const line of lines) {
        const [a, b, c] = line;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

// Returns true if there are no empty squares left
function isBoardFull() {
    for (let i = 0; i < board.length; i++) {
        if (board[i] === "") {
            return false;
        }
    }
    return true;
}

// Clear the board for a new game (players stay the same)
function resetGame() {
    board = [
        "", "", "",
        "", "", "",
        "", "", ""
    ];
    currentPlayer = "X";
    winner = null;
}

// Start the server
server.listen(PORT, function () {
    console.log("Server running at http://localhost:" + PORT);
});
