var socket = io();

var currentRoom = "global";
var producer = "";
var myUsername = "";
var session = [];

// Prompt for username on connecting to server
socket.on("connect", function () {
  if (window.location.href.includes('producer')) {
    producer = getRandom(1, 100);
    socket.emit("createProducer", `Producer${producer}`);
  }
  else if (window.location.href.includes('testview')) {
    myUsername = getRandom(1, 100);
    socket.emit("createUser", `TestViewer${myUsername}`);
    //socket.emit("enterRoom", 'global');
  } 
  else {
    myUsername = getRandom(1, 100);
    socket.emit("createUser", `User${myUsername}`);
    const param = window.location.href.split('/')[window.location.href.split('/').length - 1];
    socket.emit("enterRoom", param);
  }
});

socket.on("showRawJson", function (username, data) {
  var html = "";
  if (username === "INFO") {
    html  += `<div class="announcement"><span>${data}</span></div>`;
  } else {
    html  += `<div class="message_holder">
                              <div class="message_box">
                                <div id="message" class="message">
                                  ${data}
                                </div>
                              </div>
                             </div>
      `;
  }
  $("#view_json").append(html);
  $("#view_json").scrollTop($("#view_json").prop("scrollHeight"));
})

socket.on("updateChat", function (username, data) {

  var html = "";
  if (username === "INFO") {
    html += `<div class="announcement"><span>${data}</span></div>`;
  } else {
    console.log("Displaying user message");
    var minutes = Math.floor((data.duration % (60 * 60)) / (60));
    var seconds = Math.floor(data.duration % (60));
    html += ` <div class="message_holder">
                <div class="pic"></div>
                <div class="message_box">
                  <div id="message" class="message">
                    <h3 style="margin: 0 auto !important;">${data.name}</h3>
                    <p>Duration:${minutes + 'm ' + seconds + 's'}</p>
                    <table>
                      <tr>
                        <th>Rank</th>
                        <th>Driver</th>
                        <th>Laps</th>
                        <th>Total</th>
                        <th>Last</th>
                        <th>Best</th>
                      </tr>`;
                  for (let driver of data.drivers) {
                    html += `
                      <tr class="${data.drivers.indexOf(driver) == 0 && driver.laps > 0 ? 'active_tr' : ''}">
                        <td>${data.drivers.indexOf(driver) + 1}</td>
                        <td>${driver.name}</td>
                        <td>${driver.laps}</td>
                        <td>${getFormatTime(driver.total)}</td>
                        <td>${getFormatTime(driver.last)}</td>
                        <td>${getFormatTime(driver.best)}</td>
                      </tr>
                    `
                  }
                  html +=`
                    </table>
                  </div>
                </div>
              </div>`;
  }

  $("#chat").html(html);
  $("#chat").scrollTop($("#chat").prop("scrollHeight"));
});

socket.on("updateRoomsList", function (rooms, newRoom) {
  var html = "";
  if (window.location.href.includes("testview")) {
    for (var room of rooms) {
      html +=  `<div class="room_card" id="${room.name}"
                  onclick="changeRoom('${room.name}')">
                  <div class="room_item_content">
                      <div class="pic"></div>
                      <div class="roomInfo">
                      <span class="room_name">#${room.name}</span>
                      
                      </div>
                  </div>
              </div>`;
    }
  } else {
    for (var room of rooms) {
      html += `<div class="room_card" id="${room.name}"
                    onclick="enterRoom('${room.name}')">
                    <div class="room_item_content">
                        <div class="pic"></div>
                        <div class="roomInfo">
                        <span class="room_name">${room.link}</span>
                        <span class="room_author">Copy</span>
                        </div>
                    </div>
                </div>`;
    }
  }
  $("#active_rooms_list").html(html);
  $(".room_card").removeClass("active_item");
  $("#" + currentRoom).addClass("active_item");
});

socket.on("enterRoomsBy", function(room) {
  if (room != currentRoom) {
    socket.emit("updateRooms", room);
    socket.emit("updateRoomsList");
    $("#" + currentRoom).removeClass("active_item");
    currentRoom = room;
    $("#" + currentRoom).addClass("active_item");
  }
})

socket.on("sendData", function (arr) {
  const data = {
    name: session[0].name,
    duration: session[0].duration,
    drivers: arr 
  }
  socket.emit("sendMessage", data);
})

socket.on("createdSessions", function(data) {
  session = [...data.races];
  const drivers = [];
  
  for (var i = 0; i < session[0].drivers.length; i ++) {
    drivers.push({name: session[0].drivers[i].name, id: session[0].drivers[i].transponderId, laps: 0, total: 0, last: 0, best: 0});
  }
  socket.emit("initDrivers", drivers);
})

function getRandom(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}

function enterRoom(id) {
  if (id == 'global') window.location.replace('http://localhost:5000/');
  else window.location.replace('http://localhost:5000/' + id);
}

function changeRoom(room) {
  if (room != currentRoom) {
    socket.emit("updateRooms", room);
    $("#" + currentRoom).removeClass("active_item");
    currentRoom = room;
    $("#" + currentRoom).addClass("active_item");
    if (room != 'global') socket.emit("sendJson");
  }
}

function getFormatTime(tp) {
  var minutes = Math.floor((parseInt(tp) % (60 * 60 * 1000)) / (60 * 1000));
  var seconds = (parseInt(tp) % (60 * 1000) / 1000).toFixed(2);
  return minutes > 0 ? minutes + 'm ' + seconds + 's' : seconds + 's'; 
}