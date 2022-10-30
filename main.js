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
const boundingRect = cCanvas.getBoundingClientRect();

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
    constructor(x1, y1, x2, y2, colour = "255, 255, 255") {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.colour = colour;
        this.height = 100;
        this.width = 2;

        this.creating = false;
        this.potens = {
            x: undefined, 
            y: undefined
        };
    }

    static create() {
        cctx.beginPath();
        
        let onCanvas = mouse.x <= cCanvas.width && mouse.y <= cCanvas.height && mouse.x >= 0 && mouse.y >= 0;

        if (mouse.hold && onCanvas) {
            if (!mouse.clicked) {
                this.potens = {x: mouse.x, y: mouse.y};
                this.creating = true;
            }
            // cctx.arc(this.potens.x, this.potens.y, 10, 0, 2* Math.PI);
            cctx.moveTo(this.potens.x, this.potens.y)
            mouse.clicked = true;

            
            cctx.lineTo(mouse.x, mouse.y);
            cctx.strokeStyle = "red";
            cctx.closePath();
            cctx.stroke();


        } else if (!mouse.hold && onCanvas) {
            mouse.clicked = false;
            if (this.creating) {
                this.creating = false;
                return new Bound(this.potens.x, this.potens.y, mouse.x, mouse.y);
            }
        }
    }

    draw() {
        cctx.beginPath();
        cctx.moveTo(this.x1,this.y1);
        cctx.lineTo(this.x2, this.y2);
        cctx.lineWidth = this.width;
        cctx.strokeStyle = `rgba(${this.colour}, 1)`;
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
        this.z = 0;
        this.bob = 0;
        this.bobbage = {
            speed: 0.3,
            ferocity: 2,
        };
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
            if (Math.abs(this.z) < 0.001) this.z = 0;
            this.z *= 0.9;
            this.bob = 0;
        }

        if (keys.up.pressed) {
            if (this.velo >= 5) {
                this.velo = 5
            }
            this.velo += this.accel;
            this.pastRotation = this.rotation;

            this.z = Math.sin(this.bob) * this.bobbage.ferocity;
            this.bob += this.bobbage.speed;
        } 

        if (keys.down.pressed) {
            if (this.velo <= -3) {
                this.velo = -3
            }
            this.velo -= this.accel;
            this.pastRotation = this.rotation;

            this.z = Math.sin(this.bob) * this.bobbage.ferocity / 2;
            this.bob += this.bobbage.speed;
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
                
            if (this.num == 1) {
                ray.angle = this.emitter.rotation;
            } else if (this.fov < Math.PI) {
                ray.angle = this.emitter.rotation + Math.atan(this.segmentLen * i - this.fovHalfLen);
            } else {
                ray.angle = this.emitter.rotation + (this.fov / (this.num - 1)) * i - this.fov/2;
            }
            ray.point = {
                x: this.emitter.x + this.sight * Math.cos(ray.angle), 
                y: this.emitter.y + this.sight * Math.sin(ray.angle),
            }
            
            // Sort bounds by whichever one the current ray hits first.
            if (bounds.length) {
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
                if (point) {
                    cctx.strokeStyle = `rgba(${bounds[0].colour}, 1)`;
                    ray.point = point
                } else cctx.strokeStyle = this.colour;

                this.render(ray, i, bounds[0]);
            } else cctx.strokeStyle = this.colour;

            cctx.beginPath();
            cctx.moveTo(this.emitter.x, this.emitter.y);
            cctx.lineTo(ray.point.x, ray.point.y);
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
        let spacing = rCanvas.width / (this.num),
            dist = Math.hypot(ray.point.x - this.emitter.x, ray.point.y - this.emitter.y);
        
        rctx.fillStyle = `rgba(${bound.colour}, ${1 - (dist / this.sight)})`;
        
        let angleDiff = ray.angle - (this.emitter.rotation);
        dist *= Math.cos(angleDiff)
        
        // Bounds
        let rectLen = (bound.height * rCanvas.height) / dist,        
            boundPos = (rCanvas.height / 2 - rectLen / 2) + this.emitter.z;
        rctx.fillRect(spacing * curr, boundPos, spacing, rectLen);
        

        // Floor
        let floorPos = (rCanvas.height / 2 + rectLen / 2) + this.emitter.z,
            floorLen = rCanvas.height - floorPos;
            
        let floorGrad = rctx.createLinearGradient(spacing * curr, floorPos - floorLen, spacing * curr, floorPos + floorLen);
        floorGrad.addColorStop(0.5, rctx.fillStyle);
        floorGrad.addColorStop(1, "white");
        
        let ceilLen = (rCanvas.height / 2 - rectLen / 2) + this.emitter.z,
            ceilPos = 0;

        // Ceiling
        let ceilGrad = rctx.createLinearGradient(spacing * curr, ceilPos + ceilLen, spacing * curr, ceilPos);
        ceilGrad.addColorStop(0, rctx.fillStyle);
        ceilGrad.addColorStop(1, "white");
        
        
        rctx.fillStyle = floorGrad
        rctx.fillRect(spacing * curr, floorPos, spacing, floorLen);
        rctx.fillStyle = ceilGrad;
        rctx.fillRect(spacing * curr, ceilPos, spacing, ceilLen);
    }
}

let player = new Player(cCanvas.width / 2, cCanvas.height / 2, 15),
    presetWalls = [
        new Bound(50, 50, 50, 350), 
        new Bound(50, 350, 700, 350), 
        new Bound(700, 350, 700, 50), 
        new Bound(50, 50, 700, 50), 
    ];

let mouse = {
    x: 0, 
    y: 0,
    hold: false,
    clicked: false,
};

let keys = {
    up: {pressed: false},
    left: {pressed: false},
    down: {pressed: false},
    right: {pressed: false},
};


window.addEventListener("keydown", (e) => {
    switch (e.key) {
        case "w":
            keys.up.pressed = true;
            break;
        case "a":
            keys.left.pressed = true;
            break;
        case "s":
            keys.down.pressed = true;
            break;
        case "d":
            keys.right.pressed = true;
            break;
    }
});

window.addEventListener("keyup", (e) => {
    switch (e.key) {
        case "w":
            keys.up.pressed = false;
            break;
        case "a":
            keys.left.pressed = false;
            break;
        case "s":
            keys.down.pressed = false;
            break;
        case "d":
            keys.right.pressed = false;
            break;
    }
});

window.addEventListener("mousemove", (e) => {
    mouse.x = (e.clientX - boundingRect.left) * scale;
    mouse.y = (e.clientY - boundingRect.top) * scale;
})

window.addEventListener("mousedown", (e) => {
    mouse.hold = true;
})

window.addEventListener("mouseup", (e) => {
    mouse.hold = false;
})

let walls = [];
function main() {
    requestAnimationFrame(main);

    cctx.clearRect(0, 0, cCanvas.width, cCanvas.height);
    rctx.clearRect(0, 0, cCanvas.width, cCanvas.height);

    
    for (let wall of walls) wall.draw();
    let rays = new Rays(player, fov=90, num=500, sight=1000);
    rays.draw(bounds=walls);
    player.movement();
    player.draw();
    
    let potentialBound = Bound.create();
    if (potentialBound) walls.push(potentialBound);
}

main();