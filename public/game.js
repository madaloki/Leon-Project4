// Michael Leon
// Introduction to Web Development
// Project 4, Problem 1: Multi-player Tic-Tac-Toe client
// The server keeps the real game. This file sends clicks to the server
// and redraws the board whenever the server sends a new "state".

// Connect to the Socket.IO server
const socket = io();

// Get HTML elements from the DOM
const canvas = document.getElementById("gameCanvas");    // canvas
const ctx = canvas.getContext("2d");                     // 2D drawing context
const statusText = document.getElementById("status");    // turn / winner text
const loggedInText = document.getElementById("loggedIn");// who am I
const playersText = document.getElementById("players");  // who is X and O
const messageText = document.getElementById("message");  // error messages
const resetBtn = document.getElementById("resetBtn");    // reset game button
const joinBtn = document.getElementById("joinBtn");      // join game button
const nameBox = document.getElementById("nameBox");      // name input
const passwordBox = document.getElementById("passwordBox"); // password input

const CELL_SIZE = 200;   // each square is 200 x 200 pixels

// Local copy of the board (filled in by the server)
let board = [
    "", "", "",
    "", "", "",
    "", "", ""
];

// First thing to do is draw the empty board
drawBoard();

// ---------- Things the user does ----------

// Join button: send name and password to the server
joinBtn.addEventListener("click", function () {
    socket.emit("join", {
        name: nameBox.value,
        password: passwordBox.value
    });
});

// Click on the canvas: tell the server which square was clicked
canvas.addEventListener("click", handleClick);

// Reset button: ask the server to reset the game
resetBtn.addEventListener("click", function () {
    socket.emit("reset");
});

// ---------- Messages from the server ----------

// The server told us what role we got
socket.on("joined", function (data) {
    if (data.role === "Spectator") {
        loggedInText.textContent = `Logged in as ${data.name} (Spectator - game is full)`;
    } else {
        loggedInText.textContent = `Logged in as ${data.name} (${data.role})`;
    }
    messageText.textContent = "";
    joinBtn.disabled = true;   // can only join once
});

// The server sent the newest game state
socket.on("state", function (state) {
    board = state.board;

    // Show who is playing
    let xName = state.xName;
    let oName = state.oName;
    if (xName === null) {
        xName = "waiting...";
    }
    if (oName === null) {
        oName = "waiting...";
    }
    playersText.textContent = `X: ${xName} | O: ${oName}`;

    // Show the turn or the winner
    if (state.winner === "tie") {
        statusText.textContent = "It's a Tie!";
    } else if (state.winner) {
        statusText.textContent = `Winner: ${state.winner}`;
    } else if (state.xName === null || state.oName === null) {
        statusText.textContent = "Waiting for players";
    } else {
        statusText.textContent = `Player ${state.currentPlayer} Turn`;
    }

    messageText.textContent = "";
    drawBoard();
});

// The server sent an error or info message
socket.on("message", function (text) {
    messageText.textContent = text;
});

// ---------- Functions ----------

// Clear the canvas, then draw the grid and the pieces
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);   // clear canvas
    drawGrid();                                         // draw grid lines
    drawPieces();                                       // draw Xs and Os
}

// Called every time the player clicks the canvas
function handleClick(event) {
    // Figure out where the mouse is inside the canvas
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Turn the mouse position into a row and column (0, 1, or 2)
    const col = Math.floor(mouseX / CELL_SIZE);
    const row = Math.floor(mouseY / CELL_SIZE);
    const index = row * 3 + col;   // position in the board array (0 - 8)

    // The server checks if the move is allowed
    socket.emit("move", index);
}

// Draw the 4 lines that make the tic-tac-toe grid
function drawGrid() {
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(200, 0);   ctx.lineTo(200, 600);   // vertical line 1
    ctx.moveTo(400, 0);   ctx.lineTo(400, 600);   // vertical line 2
    ctx.moveTo(0, 200);   ctx.lineTo(600, 200);   // horizontal line 1
    ctx.moveTo(0, 400);   ctx.lineTo(600, 400);   // horizontal line 2
    ctx.stroke();
}

// Look at each square and draw an X or O if one is there
function drawPieces() {
    for (let i = 0; i < board.length; i++) {
        const row = Math.floor(i / 3);   // 0 - 2
        const col = i % 3;               // 0 - 2

        // (x, y) is the top-left corner of the square
        const x = col * CELL_SIZE;
        const y = row * CELL_SIZE;

        if (board[i] === "X") {
            drawX(x, y);
        }
        if (board[i] === "O") {
            drawO(x, y);
        }
    }
}

// Draw an X inside the square that starts at (x, y)
function drawX(x, y) {
    ctx.beginPath();
    ctx.moveTo(x + 30, y + 30);     // line 1 start
    ctx.lineTo(x + 170, y + 170);   // line 1 end
    ctx.moveTo(x + 170, y + 30);    // line 2 start
    ctx.lineTo(x + 30, y + 170);    // line 2 end
    ctx.stroke();
}

// Draw an O (circle) inside the square that starts at (x, y)
function drawO(x, y) {
    ctx.beginPath();
    ctx.arc(x + 100, y + 100, 70, 0, Math.PI * 2);
    ctx.stroke();
}
