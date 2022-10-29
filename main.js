const casterCanvas = document.getElementById("raycaster");
const cctx = casterCanvas.getContext("2d");

const renderCanvas = document.getElementById("renderer");
const rctx = renderCanvas.getContext("2d");

const scale = window.devicePixelRatio;
cctx.scale(scale, scale);
rctx.scale(scale, scale);

const size = [600, 300];
casterCanvas.style.width = renderCanvas.style.width = size[0] + "px";
casterCanvas.style.height = renderCanvas.style.height = size[1] + "px";
casterCanvas.width = renderCanvas.width = size[0] * scale;
casterCanvas.height = renderCanvas.height = size[1] * scale;

class Bound {
    /**
     * Objects that can block rays, in other words, walls.
     * @param {float} x1 
     * @param {float} y1 
     * @param {float} x2 
     * @param {float} y2 
     * @param {string} colour 
     * @param {float} width 
     */
    constructor(x1, y1, x2, y2, colour = "white", width = 2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.width = width;
        this.colour = colour;
    }

    draw() {
        cctx.beginPath();
        cctx.moveTo(this.x1,this.y1);
        cctx.lineTo(this.x2, this.y2);
        cctx.lineWidth = this.width;
        cctx.strokeStyle = this.colour;
        cctx.stroke();
    }
}

class Player {
    /**
     * User controlled object.
     * @param {float} x
     * @param {float} y
     * @param {float} radius
     * @param {float} fov - field of view displayed by rays
     * @param {string} colour
     * @param {string} rayColour
     * @property {float} rotation
     * @property {float} pastRotation - rotation before user input is removed
     * @property {float} rotateSpeed
     * @property {float} accel - acceleration rate
     * @property {float} velo
     * @property {object} rays - property of rays
     */
    constructor(x, y, radius, fov = 135, colour = "white", rayColour = "white") {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.fov = fov * Math.PI / 180;
        this.colour = colour;
        
        this.rotation = 0;
        this.pastRotation = 0;
        this.rotateSpeed = 4 * Math.PI / 180;
        this.accel = 0.1;
        this.velo = 0;
    }

    draw() {
        cctx.beginPath();
        cctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        cctx.fillStyle = this.colour;
        cctx.fill();
    }

    /**
     * Handles arrowkey movements
     */
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

class Rays {
    constructor(emitter, fov, num, sight, colour = "white") {
        this.emitter = emitter
        this.fov = fov * Math.PI/180;
        this.num = num;
        this.sight = sight;
        this.density = undefined;
        this.colour = colour;
        
        if (this.num != 1 && this.num != 360) {
            this.density = this.fov / (this.num - 1);
        } else this.density = this.fov
    }
    /**
     * Draw each ray sequentially.
     * @param {list} bounds - Objects which can block rays
     */
     draw(bounds) {
        for (let i = 0; i < this.num; i++) {
            let ray = {
                point: undefined,
                angle: undefined,
            };
                
            // Offset all rays so that it aligns with player rotation.
            if (this.num != 1) {
                ray.angle = (this.emitter.rotation + i * this.density) + (Math.PI / 2 - this.fov / 2);
            } else {
                ray.angle =  this.emitter.rotation + Math.PI / 2;
            }

            ray.point = {
                x: this.emitter.x + this.sight * Math.cos(ray.angle), 
                y: this.emitter.y + this.sight * Math.sin(ray.angle),
            }
            
            // Sort bounds by whichever one the current ray hits first.
            bounds.sort((a, b) => {
                let aPoint = this.rayIntersection(ray, a),
                    bPoint = this.rayIntersection(ray, b);
                
                if (!aPoint) return 1;
                if (!bPoint) return -1;

                let playerToA = Math.hypot(this.emitter.x - aPoint.x, this.emitter.y - aPoint.y);
                let playerToB = Math.hypot(this.emitter.x - bPoint.x, this.emitter.y - bPoint.y);
                
                return playerToA - playerToB;
            })

            let point = this.rayIntersection(ray, bounds[0]);
            if (point) ray.point = point

            cctx.beginPath();
            cctx.moveTo(this.emitter.x, this.emitter.y);
            cctx.lineTo(ray.point.x, ray.point.y);
            cctx.strokeStyle = this.rayColour;
            cctx.lineWidth = 1;
            cctx.stroke();
        }
    }


    /**
     * Calculates point of intersection between a ray and a bound.
     * @param {Object} ray - A line emitted from player
     * @param {Bound} bound - Objects which can block rays
     * @returns {Object} point of intersection
     */
    rayIntersection(ray, bound) {
        let r = {x: ray.point.x - this.emitter.x, y: ray.point.y - this.emitter.y};
        let s = {x: bound.x2 - bound.x1, y: bound.y2 - bound.y1};
        
        let deno = r.x * s.y - r.y * s.x;
        let u = ((bound.x1 - this.emitter.x) * r.y - (bound.y1 - this.emitter.y) * r.x) / deno;
        let t = ((bound.x1 - this.emitter.x) * s.y - (bound.y1 - this.emitter.y) * s.x) / deno;

        return (u >= 0 && u <= 1 && t >= 0 && t <= 1) && {x: this.emitter.x + r.x*t, y: this.emitter.y + r.y*t};
    }
}

let player = new Player(casterCanvas.width / 2, casterCanvas.height / 2, 15),
    walls = [
        new Bound(100, 200, 200, 300), 
        new Bound(200, 300, 400, 350), 
        new Bound(400, 350, 600, 250), 
    ];

let mouse = {x: 0, y: 0,},
    keys = {
        up: {pressed: false},
        left: {pressed: false},
        down: {pressed: false},
        right: {pressed: false},
    };


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


function main() {
    requestAnimationFrame(main);

    cctx.clearRect(0, 0, casterCanvas.width, casterCanvas.height);
    walls.forEach((wall) => wall.draw());
    player.draw();
    player.movement();
    let rays = new Rays(player, fov=135, num=100, sight=500);
    rays.draw(bounds=walls);

    dctx.clearRect(0, 0, casterCanvas.width, casterCanvas.height);
}

main();