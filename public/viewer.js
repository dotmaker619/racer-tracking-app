class Racer {
    constructor(name, transpordId) {
        this.name = name,
        this.transpordId = transpordId,
        this.start = Date.now(),
        this.laps = [
        ]
    }

    addLap() {
        this.laps.push({
            transponderId: this.transpordId,
            name: this.name,
            kind: 'normal',
            userIndex: this.laps.length == 0 ? 1 : this.laps.length + 1,
            endTimestamp: Date.now() - this.start,
            duration: this.laps.length == 0 ? Date.now() - this.start : Date.now() - this.laps[this.laps.length - 1].endTimestamp - this.start 
        })
    }

    getLapEvent() {
        return this.laps[this.laps.length - 1];
    }

    getLastLap() {
        return this.laps.length == 0 ? 0 : this.laps[this.laps.length - 1].duration;
    }

    getBestLap() {
        return this.laps.length == 0 ? 0 : [...this.laps].sort(function(a, b){return a.duration - b.duration})[0].duration;
    }

    getName() {
        return this.name;
    }

    getId() {
        return this.transpordId;
    }

    getLaps() {
        return this.laps.length;
    }

    getTotalTime() {
        let total = 0;
        for (let i = 0; i < this.laps.length; i ++) {
            total += this.laps[i].duration;
        }
        return total;
    }
}

class Drivers {
    constructor() {
        this.drivers = [];
    }

    newDriver(name, id) {
        let driver = new Racer(name, id);
        this.drivers.push(driver);
    }

    getDrivers() {
        return this.drivers;
    }

    getLength() {
        return this.drivers.length;
    }

    remove() {
        this.drivers = [];
    }
}

let drivers = new Drivers();

socket.on("initialize", function(arr) {
    for (let i = 0; i < arr.length; i ++) {
        drivers.newDriver(arr[i].name, arr[i].id);
    }
})

socket.on("refreshRace", function () {
    drivers.remove();
})

socket.on("addLaps", function(id) {
    let racer =  [...drivers.getDrivers()].filter(e => e.getId() == parseInt(id))[0];
    racer.addLap();
    
    let arr = []

    for (let i = 0; i < drivers.getLength(); i ++) {
        arr.push(
            {
                name: drivers.getDrivers()[i].getName(),
                laps: drivers.getDrivers()[i].getLaps(),
                total: drivers.getDrivers()[i].getTotalTime(),
                last: drivers.getDrivers()[i].getLastLap(),
                best: drivers.getDrivers()[i].getBestLap()
            }
        )
    }
    
    socket.emit("sendLapEvent", racer.getLapEvent());
    socket.emit("sendData", [...arr].sort(function(a, b){return b.laps - a.laps}));
})