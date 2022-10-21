var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");
const scale = window.devicePixelRatio;
ctx.scale(scale, scale);

var size = [600, 300];
canvas.style.width = size[0] + "px";
canvas.style.height = size[1] + "px";
canvas.width = size[0] * scale;
canvas.height = size[1] * scale;

class Wall {
    constructor(x, y, width, height, colour = "black") {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.colour = colour;
    }

    draw() {
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fill()
    }
}

class Player {
    constructor(x, y, radius, fov = 135, sight = 200) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.fov = fov;
        this.sight = sight;
        this.speed = 5;
        this.numRays = 25;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
    }

    showFOV() {
        let fovAngle = this.fov * Math.PI / 180;
        this.direction = Math.atan2((mouse.y - this.y), (mouse.x - this.x)) - fovAngle / 2;
        let rayDensity = fovAngle / (this.numRays - 1);
        let rayAngle;

        for (let i = 0; i < this.numRays; i++) {
            rayAngle = this.direction + i * rayDensity;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            let rayPoint = {
                x: this.x + this.sight * Math.cos(rayAngle), 
                y: this.y + this.sight * Math.sin(rayAngle),
            }
            ctx.lineTo(rayPoint.x, rayPoint.y);
            let sightOpacity = ctx.createLinearGradient(this.x, this.y, rayPoint.x, rayPoint.y);
            sightOpacity.addColorStop(0.5, "black");
            sightOpacity.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.strokeStyle = sightOpacity;
            ctx.stroke();
        }
    }

    movement() {
        if (keys.w.pressed) {
            this.y -= this.speed;
        }
        if (keys.a.pressed) {
            this.x -= this.speed;
        }
        if (keys.s.pressed) {
            this.y += this.speed;
        }
        if (keys.d.pressed) {
            this.x += this.speed;
        }
    }
}

let player = new Player(canvas.width/2, canvas.height/2, 15);

let walls = [
    new Wall(300, 250, 100, 100), 
    //new Wall(100, 200, 200, 10)
]

let keys = {
    w: {pressed: false},
    a: {pressed: false},
    s: {pressed: false},
    d: {pressed: false},
}

let mouse = {
    x: 0,
    y: 0,
}

window.addEventListener("keydown", (e) => {
    switch (e.key) {
        case "w":
            keys.w.pressed = true;
            break;
        case "a":
            keys.a.pressed = true;
            break;
        case "s":
            keys.s.pressed = true;
            break;
        case "d":
            keys.d.pressed = true;
            break;
    }
});

window.addEventListener("keyup", (e) => {
    switch (e.key) {
        case "w":
            keys.w.pressed = false;
            break;
        case "a":
            keys.a.pressed = false;
            break;
        case "s":
            keys.s.pressed = false;
            break;
        case "d":
            keys.d.pressed = false;
            break;
    }
});

window.addEventListener('mousemove', (e) => {
    let bounds = canvas.getBoundingClientRect();
    mouse.x = Math.round((e.clientX - bounds.left) * scale);
    mouse.y = Math.round((e.clientY - bounds.top) * scale);
  });

function main() {
    requestAnimationFrame(main);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    player.draw();
    player.movement(walls);
    player.showFOV();
    walls.forEach((wall) => wall.draw());
}

main();