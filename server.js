const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

app.get("/:id", (req, res) => {
  const id = req.params.id;  
  if (parseInt(id) > 0) {
    res.sendFile(__dirname + "/public/index.html");
  } else if (id == 'testview') {
    res.sendFile(__dirname + "/public/testview.html");
  } else if (id == 'producer') {
    res.sendFile(__dirname + "/public/producer.html");
  } else {
    res.send(`<h1>Oops! Can't not find pages.</h1>`);
  }
})

// Global variables to hold all usernames and rooms created
var usernames = {};
var rooms = [
  { name: "global", creator: "Anonymous" },
];

let session_info = [];

io.on("connection", function (socket) {
  console.log(`User connected to server.`);

  socket.on("createUser", function (username) {
    socket.username = username;
    usernames[username] = username;
    socket.currentRoom = "global";
    socket.join("global");

    //socket.emit("updateChat", "INFO", "You have joined global room");
    socket.emit("showRawJson", "INFO", "You have joined global room");

    socket.emit("updateRoomsList", rooms, "global");
  });

  socket.on("createProducer", function (producer) {
    socket.username = producer;
    usernames[producer] = producer;
    socket.currentRoom = "global";
    socket.join("global");

    // io.sockets.emit("updateProducers", producer);
    socket.emit("updateRoomsList", rooms, "global");
  });

  socket.on("enterRoom", function (param) {
    if (rooms.filter(e => e.name == param)) {
      socket.emit("enterRoomsBy", param);  
    } else {
      alert("The room is not exist. Please try with right room number.")
    }
  })

  socket.on("sendData", function (arr) {
    socket.emit("sendData", arr);
  })

  socket.on("sendJson", function () {
    io.sockets.to(socket.currentRoom).emit("showRawJson", socket.username, JSON.stringify(session_info[0], undefined, 2));
  })

  socket.on("sendLapEvent", function (json) {
    io.sockets.to(socket.currentRoom).emit("showRawJson", socket.username, JSON.stringify(json, undefined, 2));
  })

  socket.on("sendMessage", function (data) {
    io.sockets.to(socket.currentRoom).emit("updateChat", socket.username, data);
  });

  socket.on("createRoom", function (room) {
      rooms.push({ name: room, creator: socket.username });
      io.sockets.emit("updateRoomsList", rooms, null);
      socket.leave(socket.currentRoom);
      socket.currentRoom = room;
      socket.join(room);
  });

  socket.on("closeRoom", function() {
    if (socket.currentRoom != null) {
      const index = rooms.indexOf(rooms.filter(e => e.name == socket.currentRoom)[0]);
      rooms.splice(index, 1);
      io.sockets.emit("updateRoomsList", rooms, null);
      io.sockets.emit("updateRooms", "global");
      // socket.broadcast
      //   .to(socket.currentRoom)
      //   .emit("updateChat", "INFO", "The producer closed this room");
      socket.broadcast
        .to(socket.currentRoom)
        .emit("showRawJson", "INFO", "The producer closed this room");
      socket.leave(socket.currentRoom);
    }
  });

  socket.on("updateRoomsList", function() {
    io.sockets.emit("updateRoomsList", rooms, null);
  })

  socket.on("updateRooms", function (room) {
    // socket.broadcast
    //   .to(socket.currentRoom)
    //   .emit("updateChat", "INFO", socket.username + " left room");
    socket.leave(socket.currentRoom);
    socket.currentRoom = room;
    socket.join(room);
    if (room) {
      if (rooms.filter(e => e.name == room).length == 1) {
        //socket.emit("updateChat", "INFO", "You have joined " + room + " room");
          let race = session_info[0].races[0].drivers;
          let drivers = [];
          for (let i = 0; i < race.length; i ++) {
            drivers.push({name: race[i].name, id: race[i].transponderId, laps: 0, total: 0, last: 0, best: 0});
          }
          const sendData = {
            duration: session_info[0].races[0].duration,
            name: session_info[0].races[0].name,
            drivers: drivers
          }
          // setTimeout(() => {
            io.sockets.to(socket.currentRoom).emit("updateChat", socket.username, sendData);
          // }, 1500)
          // clearTimeout();
        socket.emit("showRawJson", "INFO", "You have joined " + room + " room");
      } else socket.emit("updateChat", "INFO", "The room is not exist. Please try with right room number.");
    }
  });

  socket.on("createSession", function(data) {
    socket.emit("createdSessions", data);
    session_info = [data];
  })

  socket.on("addLaps", function(id) {
    socket.emit("addLaps", id);
  })

  socket.on("initDrivers", function(arr) {
    socket.emit("initialize", arr);
  })

  socket.on("finishedRound", function () {
    socket.emit("refreshRace");
  })

  socket.on("disconnect", function () {
    console.log(`User ${socket.username} disconnected from server.`);
    delete usernames[socket.username];
    const index = rooms.indexOf(rooms.filter(e => e.creator == socket.username)[0]);
    if (index > -1) {
      rooms.splice(index, 1);
      io.sockets.emit("updateRoomsList", rooms, null);
      io.sockets.emit("updateRooms", "global");
      // socket.broadcast
      //   .to(socket.currentRoom)
      //   .emit("updateChat", "INFO", "The producer closed the room.");
      socket.broadcast
        .to(socket.currentRoom)
        .emit("showRawJson", "INFO", "The producer closed the room.");
      socket.leave(socket.currentRoom);
    }
  });
});

server.listen(5000, function () {
  console.log("Listening to port 5000.");
});
