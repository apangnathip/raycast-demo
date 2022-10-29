// Raycasting canvas, top-down 2D
const cCanvas = document.getElementById("raycaster");
const cctx = cCanvas.getContext("2d");

// Rendering canvas, first-person pseudo 3D
const rCanvas = document.getElementById("renderer");
const rctx = rCanvas.getContext("2d");

const scale = window.devicePixelRatio;
cctx.scale(scale, scale);
rctx.scale(scale, scale);

const size = [600, 300];
cCanvas.style.width = rCanvas.style.width = size[0] + "px";
cCanvas.style.height = rCanvas.style.height = size[1] + "px";
cCanvas.width = rCanvas.width = size[0] * scale;
cCanvas.height = rCanvas.height = size[1] * scale;

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
    constructor(x1, y1, x2, y2, width = 2, height = 100, colour = "white") {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.width = width;
        this.height = height;
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
     * @param {string} colour
     * @property {float} rotation
     * @property {float} pastRotation - rotation before user input is removed
     * @property {float} rotateSpeed
     * @property {float} accel - acceleration rate
     * @property {float} velo
     */
    constructor(x, y, radius, colour = "white") {
        this.x = x;
        this.y = y;
        this.radius = radius;
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
    
        this.x += this.velo * Math.cos(this.pastRotation);  
        this.y += this.velo * Math.sin(this.pastRotation);  
    }
}

class Rays {
    /**
     * Group of rays emitted by an object
     * @param {Player} emitter - object emitting rays
     * @param {float} fov - field of view in radians
     * @param {int} num - number of rays
     * @param {float} sight - length of rays
     * @param {string} colour 
     */
    constructor(emitter, fov, num, sight, colour = "white") {
        this.emitter = emitter
        this.fov = fov * Math.PI/180;
        this.num = num;
        this.sight = sight;
        this.colour = colour;
        
        // Corrects spherical distortion by fixed view segments rather than fixed view angles.
        this.fovHalfLen = Math.tan(this.fov/2);
        this.segmentLen = this.fovHalfLen / ((this.num - 1) / 2);
    }
    /**
     * Draw each ray sequentially.
     * @param {list} bounds - objects which can block rays
     */
     draw(bounds) {
        for (let i = 0; i < this.num; i++) {
            let ray = {point: undefined, angle: undefined};
                
            if (this.num != 1) {
                ray.angle = this.emitter.rotation + Math.atan(this.segmentLen * i - this.fovHalfLen);
            } else ray.angle = this.emitter.rotation;

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

                let playerToA = Math.hypot(this.emitter.x - aPoint.x, this.emitter.y - aPoint.y),
                    playerToB = Math.hypot(this.emitter.x - bPoint.x, this.emitter.y - bPoint.y);
                
                return playerToA - playerToB;
            })

            let point = this.rayIntersection(ray, bounds[0]);
            if (point) ray.point = point

            this.render(ray, i, bounds[0]);

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
        let r = {x: ray.point.x - this.emitter.x, y: ray.point.y - this.emitter.y},
            s = {x: bound.x2 - bound.x1, y: bound.y2 - bound.y1};
        
        let deno = r.x * s.y - r.y * s.x,
            u = ((bound.x1 - this.emitter.x) * r.y - (bound.y1 - this.emitter.y) * r.x) / deno,
            t = ((bound.x1 - this.emitter.x) * s.y - (bound.y1 - this.emitter.y) * s.x) / deno;

        return (u >= 0 && u <= 1 && t >= 0 && t <= 1) && {x: this.emitter.x + r.x*t, y: this.emitter.y + r.y*t};
    }

    /**
     * Render ray collision into a pseudo 3D image.
     * @param {Object} ray 
     * @param {integer} curr - iterative number, current loop
     * @param {Bound} bound 
     */
    render(ray, curr, bound) {
        let spacing = Math.round(rCanvas.width / (this.num)),
            dist = Math.hypot(ray.point.x - this.emitter.x, ray.point.y - this.emitter.y);

        rctx.fillStyle = `rgba(255,255,255, ${1 - (dist / this.sight)})`;

        let angleDiff = ray.angle - (this.emitter.rotation);
        dist *= Math.cos(angleDiff)
      
        let rectLength = (bound.height * rCanvas.height) / dist;
        if (rectLength >= rCanvas.height) rectLength = rCanvas.height;
        
        let yPos = rCanvas.height/2 - rectLength/2;
        rctx.fillRect(spacing * (curr), yPos, spacing, rectLength);
    }
}

let player = new Player(cCanvas.width / 2, cCanvas.height / 2, 15),
    walls = [
        new Bound(50, 50, 50, 350), 
        new Bound(50, 350, 700, 350), 
        new Bound(700, 350, 700, 50), 
        new Bound(50, 50, 700, 50), 
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

    cctx.clearRect(0, 0, cCanvas.width, cCanvas.height);
    rctx.clearRect(0, 0, cCanvas.width, cCanvas.height);

    walls.forEach((wall) => wall.draw());
    player.draw();
    player.movement();
    let rays = new Rays(player, fov=90, num=50, sight=500);
    rays.draw(bounds=walls);
}

main();