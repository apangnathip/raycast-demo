var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");
const scale = window.devicePixelRatio;
ctx.scale(scale, scale);

var size = [600, 300];
canvas.style.width = size[0] + "px";
canvas.style.height = size[1] + "px";
canvas.width = size[0] * scale;
canvas.height = size[1] * scale;

class Player {
    constructor(x, y, radius, fov, sight = 10) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.sight = sight;
        this.speed = 5;
        this.rotation;
        this.velocity;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
        ctx.fill();
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

let player = new Player(25, 25, 15, 90);

let keys = {
    w: {pressed: false},
    a: {pressed: false},
    s: {pressed: false},
    d: {pressed: false},
}

let mouse = {
    x: undefined,
    y: undefined,
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

canvas.addEventListener('mousemove', (e) => {
    let bounds = canvas.getBoundingClientRect();
    mouse.x = Math.round((e.clientX - bounds.left) * scale);
    mouse.y = Math.round((e.clientY - bounds.top) * scale);
  });

function main() {
    requestAnimationFrame(main);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    player.draw();
    player.movement();
}

main();