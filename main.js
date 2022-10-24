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
    constructor(x1, y1, x2, y2, colour = "gray", width = 5) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.width = width;
        this.colour = colour;
    }

    draw() {
        ctx.beginPath();
        ctx.moveTo(this.x1,this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.lineWidth = this.width;
        ctx.strokeStyle = this.colour;
        ctx.stroke();
    }
}

class Player {
    constructor(x, y, radius, fov = 135, colour = "gray", rayColour = "white") {
        this.x = x;
        this.y = y;
        this.fov = fov * Math.PI / 180;
        this.colour = colour;
        this.rayColour = rayColour;
        
        this.pastRotation = 0;
        this.rotateSpeed = 4 * Math.PI / 180;
        this.rotation = 0;
        this.radius = radius;
        this.accel = 0.1;
        this.velo = 0;
        this.rays = {
            num: 1000,
            sight: 250,
            density: undefined,
        };

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

    project(bound) {
        let boundVec = {
            x: bound.x2 - bound.x1, 
            y: bound.y2 - bound.y1,
        }
        let playerVec = {
            x: bound.x1 - this.x,
            y: bound.y1 - this.y,
        }
        
        let projScale = (playerVec.x * boundVec.x + playerVec.y * boundVec.y) / 
        (boundVec.x**2 + boundVec.y**2)

        let projPoint = {
            x: bound.x1 - projScale * boundVec.x,
            y: bound.y1 - projScale * boundVec.y,
        }

        return projPoint
    }

    rayIntersection(rayPoint, bound) {
        let A1 = rayPoint.y - this.y,
                B1 = this.x - rayPoint.x,
                C1 = A1 * this.x + B1 * this.y,
                A2 = bound.y2 - bound.y1,
                B2 = bound.x1 - bound.x2,
                C2 = A2 * bound.x1 + B2 * bound.y1,
                deno = A1 * B2 - A2 * B1;

        if (deno == 0) return null;

        let intPoint = {
            x: (B2 * C1 - B1 * C2) / deno,
            y: (A1 * C2 - A2 * C1) / deno,
        }

        let intWallRatio = (intPoint.x - bound.x2) / B2,
            intRayRatio = (intPoint.x - rayPoint.x) / B1,
            playerToInt = Math.sqrt((intPoint.x - this.x)**2 + (intPoint.y - this.y)**2)

        if (isNaN(intRayRatio)) intRayRatio = 0;

        let withinWall = intWallRatio < 1 && intWallRatio > 0 && intRayRatio < 1,
            shorterThanSight = playerToInt <= this.rays.sight

        if (!withinWall || !shorterThanSight) return null;

        rayPoint.x = intPoint.x;
        rayPoint.y = intPoint.y;
        return intPoint;
    }


    drawRay(bounds) {
        for (let i = 0; i < this.rays.num; i++) {
            let rayPoint,
                rayAngle;
                
            if (this.rays.num != 1) {
                rayAngle = (this.rotation + i * this.rays.density) + Math.PI/2 - this.fov / 2;
            } else {
                rayAngle =  this.rotation + Math.PI / 2;
            }

            rayPoint = {
                x: this.x + this.rays.sight * Math.cos(rayAngle), 
                y: this.y + this.rays.sight * Math.sin(rayAngle),
            }

            bounds.sort((a, b) => {
                let aProj = this.project(a);
                let bProj = this.project(b);

                let aToPlayer = Math.sqrt((aProj.x - this.x)**2 + (aProj.y - this.y)**2);
                let bToPlayer = Math.sqrt((bProj.x - this.x)**2 + (bProj.y - this.y)**2);
                
                return bToPlayer - aToPlayer;
            });

            bounds.forEach((bound) => {
                this.rayIntersection(rayPoint, bound);
                // if (!rayInt) return
                // ctx.beginPath();
                // ctx.arc(rayInt.x, rayInt.y, 5, 0, 2 * Math.PI);
                // ctx.fill();
            });

            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(rayPoint.x, rayPoint.y);
            ctx.strokeStyle = this.rayColour;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    movement() {
        if (!keys.up.pressed && !keys.down.pressed) {
            if (Math.abs(this.velo) < 0.001) this.velo = 0;
            this.velo *= 0.9
        }

        if (keys.up.pressed) {
            if (this.velo >= 5) {
                this.velo = 5
            }
            this.velo += this.accel;
            this.pastRotation = this.rotation;
        } 

        if (keys.down.pressed) {
            if (this.velo <= -3) {
                this.velo = -3
            }
            this.velo -= this.accel;
            this.pastRotation = this.rotation;
        }

        if (keys.left.pressed) {
            this.rotation -= this.rotateSpeed;
        }

        if (keys.right.pressed) {
            this.rotation += this.rotateSpeed;
        }
    
        this.x += this.velo * Math.sin(-this.pastRotation);  
        this.y += this.velo * Math.cos(-this.pastRotation);  
    }
}

let player = new Player(canvas.width / 2, canvas.height / 2, 15);

let walls = [
    new Wall(100, 200, 200, 50),
    new Wall(150, 100, 100, 300), 
]

let keys = {
    up: {pressed: false},
    left: {pressed: false},
    down: {pressed: false},
    right: {pressed: false},
}

let mouse = {
    x: 0,
    y: 0,
}

window.addEventListener("keydown", (e) => {
    switch (e.key) {
        case "ArrowUp":
            keys.up.pressed = true;
            break;
        case "ArrowLeft":
            keys.left.pressed = true;
            break;
        case "ArrowDown":
            keys.down.pressed = true;
            break;
        case "ArrowRight":
            keys.right.pressed = true;
            break;
    }
});

window.addEventListener("keyup", (e) => {
    switch (e.key) {
        case "ArrowUp":
            keys.up.pressed = false;
            break;
        case "ArrowLeft":
            keys.left.pressed = false;
            break;
        case "ArrowDown":
            keys.down.pressed = false;
            break;
        case "ArrowRight":
            keys.right.pressed = false;
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
    player.drawRay(walls);
    walls.forEach((wall) => wall.draw());
    player.draw();
    player.movement(walls);
}

main();