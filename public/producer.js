// var socket = io(); 
var producer_name = document.getElementById("producer_name");
var start_btn = document.getElementById("start_btn");
var close_btn = document.getElementById("close_btn");
var lap_first = document.getElementById("lap_first");
var lap_second = document.getElementById("lap_second");
var lap_third = document.getElementById("lap_third");

// flag variables //
let started = false;
let closed = true;

// socket.on("updateProducers", function (producer) {
//     $("#producer_name").html(`Producer: <span class="producer_name">${producer}</span>`);
// });

start_btn.addEventListener("click", async function() {
if (!started) {
    if (closed) {
        const room = Math.floor(Math.sqrt(Date.now()) + getRandom(1, 1000)).toString();
        const link = `http://localhost:5000/${room} `; 
        socket.emit("createRoom", room);
        $("#hyperlink").html(`<a href="${link}" target="_blank">Race link</a>`);
        closed = false;
    }
    started = true;
    let response = await fetch("./session_info.json");
    let data = await response.json();
    socket.emit("createSession", data);

    var duration = data.races[0].duration;
    var st = 0;
    const x = setInterval(function() {
        var minutes = Math.floor((st % (60 * 60)) / 60);
        var seconds = Math.floor((st % 60));
        $("#counter").html(minutes + ":" + seconds);
        st += 1;
        if (st > duration || closed) {
            clearInterval(x);
            $("#counter").html("Race Ended.");
            started = false;
            socket.emit("finishedRound");
        }
    }, 1000);
} else {
    alert("The race has already started.");
}
});

close_btn.addEventListener("click", function() {
    if (!closed) {
        socket.emit("closeRoom");
        started = false;
        closed = true;
    } else alert("You can't close. No rooms here");
})

lap_first.addEventListener("click", function() {
    var lap_input_first = document.getElementById("lap_input_first");
    const transpodId = lap_input_first.value;
    if (transpodId == '') alert("Null Value");
    else {
        started && !closed ? socket.emit("addLaps", transpodId) : alert("The race is not started yet. Please wait a min.");
    }
});

lap_second.addEventListener("click", function() {
    var lap_input_second = document.getElementById("lap_input_second");
    const transpodId = lap_input_second.value;
    if (transpodId == '') alert("Null Value");
    else {
        started && !closed ? socket.emit("addLaps", transpodId): alert("The race is not started yet. Please wait a min.");
    }
});

lap_third.addEventListener("click", function() {
    var lap_input_third = document.getElementById("lap_input_third");
    const transpodId = lap_input_third.value;
    if (transpodId == '') alert("Null Value");
    else {
        started && !closed ? socket.emit("addLaps", transpodId): alert("The race is not started yet. Please wait a min.");
    }
});

function getRandom(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
  }