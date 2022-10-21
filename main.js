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
    constructor(x1, y1, x2, y2, width = 5, colour = "white") {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.width = width;
        this.colour = colour;
    }

    draw() {
    //     ctx.beginPath();
    //     ctx.fillStyle = this.colour
    //     ctx.rect(this.x, this.y, this.width, this.height);
    //     ctx.fill()
        ctx.beginPath();
        ctx.moveTo(this.x1,this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.lineWidth = this.width;
        ctx.strokeStyle = this.colour;
        ctx.stroke();
    }
}

class Player {
    constructor(x, y, radius, fov = 135, sight = 300, colour = "white") {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.fov = fov;
        this.speed = 5;
        this.sight = sight;
        this.numRays = 1;
        this.colour = colour
        this.fovAngle = this.fov * Math.PI / 180;
        this.rayDensity;
        if (this.numRays != 1) {
            this.rayDensity = this.fovAngle / (this.numRays - 1);
        } else this.rayDensity = this.fovAngle
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.colour;
        ctx.fill();
    }

    showFOV() {
        let direction = Math.atan2((mouse.y - this.y), (mouse.x - this.x)) - this.fovAngle / 2;
        

        for (let i = 0; i < this.numRays; i++) {
            let  rayAngle = (this.direction + i * this.rayDensity);
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            let rayPoint 
            if (this.numRays != 1) {
                rayPoint = {
                    x: this.x + this.sight * Math.cos(rayAngle), 
                    y: this.y + this.sight * Math.sin(rayAngle),
                }
            } else {
                rayPoint = {
                    x: this.x + this.sight * Math.cos(direction + this.fovAngle / 2), 
                    y: this.y + this.sight * Math.sin(direction + this.fovAngle / 2),
                }
            }
            ctx.lineTo(rayPoint.x, rayPoint.y);
            // let sightOpacity = ctx.createLinearGradient(this.x, this.y, rayPoint.x, rayPoint.y);
            // sightOpacity.addColorStop(0.5, "black");
            // sightOpacity.addColorStop(1, "rgba(0, 0, 0, 0)");
            // ctx.strokeStyle = sightOpacity;
            ctx.strokeStyle = this.colour;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    // isColliding(bounds) {
    //     let hit = false;
    //     let collides = {top: false, left: false, bottom: false, right: false};
    //     bounds.forEach((bound) => {
    //         hit = (
    //             Math.abs(this.x - (bound.x + bound.width / 2)) <= bound.width / 2 + this.radius &&
    //             Math.abs(this.y - (bound.y + bound.height / 2)) < bound.height / 2 + this.radius
    //             )
    //         collides.top = Math.abs(this.y - (bound.y + bound.height)) < this.radius;
    //         collides.left = Math.abs(this.x - bound.x) < this.radius;
    //         collides.bottom = Math.abs(this.y - bound.y) < this.radius;
    //         collides.right = Math.abs(this.x - (bound.x + bound.width)) < this.radius;
    //     });
    //     if (hit) {
    //         return true
    //     }
    // }

    movement(bounds) {
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
    new Wall(100, 200, 200, 10)
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
      player.showFOV();
      player.draw();
      player.movement(walls);
      walls.forEach((wall) => wall.draw());
}

main();