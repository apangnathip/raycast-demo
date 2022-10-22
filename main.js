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
    constructor(x, y, radius, fov = 135, colour = "white") {
        this.x = x;
        this.y = y;
        this.prevPos = {x, y};
        this.radius = radius;
        this.fov = fov * Math.PI / 180;
        this.speed = 5;
        this.colour = colour
        this.rays = {
            num: 1,
            sight: 300,
            density: undefined,
        }
        if (this.rays.num != 1) {
            this.rays.density = this.fov / (this.rays.num - 1);
        } else this.rays.density = this.fov
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.colour;
        ctx.fill();
    }

    showFOV() {
        let direction = Math.atan2((mouse.y - this.y), (mouse.x - this.x)) - this.fov / 2;

        for (let i = 0; i < this.rays.num; i++) {
            let rayAngle = (this.direction + i * this.rays.density);
            let rayPoint ;
            if (this.rays.num != 1) {
                rayPoint = {
                    x: this.x + this.rays.sight * Math.cos(rayAngle), 
                    y: this.y + this.rays.sight * Math.sin(rayAngle),
                }
            } else {
                rayPoint = {
                    x: this.x + this.rays.sight * Math.cos(direction + this.fov / 2), 
                    y: this.y + this.rays.sight * Math.sin(direction + this.fov / 2),
                }
            }
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(rayPoint.x, rayPoint.y);
            ctx.strokeStyle = this.colour;
            ctx.lineWidth = 1;
            ctx.stroke();
            // let sightOpacity = ctx.createLinearGradient(this.x, this.y, rayPoint.x, rayPoint.y);
            // sightOpacity.addColorStop(0.5, "black");
            // sightOpacity.addColorStop(1, "rgba(0, 0, 0, 0)");
            // ctx.strokeStyle = sightOpacity;
        }
    }

    isColliding(bounds) {
        let hit = false;
        let boundVec;
        let vUnit;
        let playerVec;
        let projuv;
        let projScale;
        let distFromBound;
        let distProj;
        let distBound;
        bounds.forEach((bound) => {
            boundVec = {
                x: bound.x2 - bound.x1, 
                y: bound.y2 - bound.y1,
            }
            playerVec = {
                x: bound.x1 - this.x,
                y: bound.y1 - this.y,
            }
            vUnit = {
                x: boundVec.x / Math.sqrt(boundVec.x**2 + boundVec.y**2),
                y: boundVec.y / Math.sqrt(boundVec.x**2 + boundVec.y**2),
            }
            
            projScale = (playerVec.x * boundVec.x + playerVec.y * boundVec.y) / 
            (boundVec.x**2 + boundVec.y**2)

            projuv = {
                x: bound.x1 - projScale * boundVec.x,
                y: bound.y1 - projScale * boundVec.y,
            }

            distFromBound = Math.sqrt((projuv.x - this.x)**2 + (projuv.y - this.y)**2);
            distProj = Math.sqrt((projuv.x - bound.x1)**2 + (projuv.y - bound.y1)**2);
            distBound = Math.sqrt(boundVec.x**2 + boundVec.y**2)
            
            if (distProj < distBound && projScale < 0) {
                ctx.beginPath();
                ctx.moveTo(projuv.x, projuv.y);
                ctx.lineTo(this.x, this.y)
                ctx.strokeStyle = "red"
                ctx.stroke();
            }

            if (distFromBound < this.radius && distProj < distBound && projScale < 0) {
                hit = true;
            } 
        });

        if (hit) {
            return true
        }   else return false;
    }

    movement(bounds) {
        if (!this.isColliding(bounds)) {
            this.prevPos.x = this.x;
            this.prevPos.y = this.y;
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
        } else {
            this.x = this.prevPos.x;
            this.y = this.prevPos.y;
        }
       
        console.log(this.isColliding(bounds));
    }
}

let player = new Player(canvas.width/2, canvas.height/2, 15);

let walls = [
    new Wall(300, 300, 100, 300), 
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
      walls.forEach((wall) => wall.draw());
      player.draw();
      player.movement(walls);
}

main();