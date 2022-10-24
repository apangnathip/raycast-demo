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
        ctx.beginPath();
        ctx.moveTo(this.x1,this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.lineWidth = this.width;
        ctx.strokeStyle = this.colour;
        ctx.stroke();
    }
}

class Player {
    constructor(x, y, radius, fov = 45, colour = "white") {
        this.x = x;
        this.y = y;
        this.fov = fov * Math.PI / 180;
        this.colour = colour
        
        this.pastRotation = 0;
        this.rotateSpeed = 4 * Math.PI / 180;
        this.rotation = 0;
        this.radius = radius;
        this.accel = 0.1;
        this.velo = 0;
        this.rays = {
            num: 25,
            sight: 1000,
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

    drawRay() {
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

            walls.forEach((wall) => {
                let A1 = rayPoint.y - this.y,
                    B1 = this.x - rayPoint.x,
                    C1 = A1 * this.x + B1 * this.y,
                    A2 = wall.y2 - wall.y1,
                    B2 = wall.x1 - wall.x2,
                    C2 = A2 * wall.x1 + B2 * wall.y1,
                    deno = A1 * B2 - A2 * B1;

                if (deno == 0) return null;

                let intPoint = {
                    x: (B2 * C1 - B1 * C2) / deno,
                    y: (A1 * C2 - A2 * C1) / deno,
                }

                let intWallRatio = (intPoint.x - wall.x2) / (wall.x1 - wall.x2),
                    intRayRatio = (intPoint.x - rayPoint.x) / (this.x - rayPoint.x);

                let withinWall = intWallRatio < 1 && intWallRatio > 0 && intRayRatio < 1;

                
                if (withinWall) {
                    ctx.beginPath();
                    ctx.arc(intPoint.x, intPoint.y, 5, 0, 2 * Math.PI);
                    ctx.fill();
                }
            })


            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(rayPoint.x, rayPoint.y);
            ctx.strokeStyle = this.colour;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    isColliding(bounds) {
        let poc,
            hit = false;

        bounds.forEach((bound) => {
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

            let projuv = {
                x: bound.x1 - projScale * boundVec.x,
                y: bound.y1 - projScale * boundVec.y,
            }

            let distFromBound = Math.sqrt((projuv.x - this.x)**2 + (projuv.y - this.y)**2),
                distProj = Math.sqrt((projuv.x - bound.x1)**2 + (projuv.y - bound.y1)**2),
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
                poc = {x: projuv.x, y: projuv.y, wallWidth: 5}
            } 
        });

        if (hit) {
            return poc
        }   else return false;
    }
    
    movement(bounds) {
        // let colliding = this.isColliding(bounds);
        // if (colliding) {
        //     let pastRotation = this.rotation
        //     this.x = colliding.x + this.radius * Math.sin(-this.rotation);
        //     this.y = colliding.y + this.radius * Math.cos(-this.rotation);
        //     this.velo = 0;
        // }

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
    new Wall(300, 300, 100, 300), 
    new Wall(100, 200, 200, 50)
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
      player.drawRay();
      walls.forEach((wall) => wall.draw());
      player.draw();
      player.movement(walls);
}

main();