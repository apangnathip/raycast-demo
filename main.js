const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const scale = window.devicePixelRatio;
ctx.scale(scale, scale);

const size = [600, 300];
canvas.style.width = size[0] + "px";
canvas.style.height = size[1] + "px";
canvas.width = size[0] * scale;
canvas.height = size[1] * scale;

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
        ctx.beginPath();
        ctx.moveTo(this.x1,this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.lineWidth = this.width;
        ctx.strokeStyle = this.colour;
        ctx.stroke();
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
        this.rayColour = rayColour;
        
        this.rotation = 0;
        this.pastRotation = 0;
        this.rotateSpeed = 4 * Math.PI / 180;
        this.accel = 0.1;
        this.velo = 0;
        this.rays = {
            num: 50,
            sight: 500,
            density: undefined,
        };

        if (this.rays.num != 1 && this.rays.num != 360) {
            this.rays.density = this.fov / (this.rays.num - 1);
        } else this.rays.density = this.fov
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.colour;
        ctx.fill();
    }

    /**
     * Draw each ray sequentially.
     * @param {list} bounds - Objects which can block rays
     */
    drawRay(bounds) {
        for (let i = 0; i < this.rays.num; i++) {
            let ray = {
                point: undefined,
                angle: undefined,
            };
                
            // Offset all rays so that it aligns with player rotation.
            if (this.rays.num != 1) {
                ray.angle = (this.rotation + i * this.rays.density) + (Math.PI / 2 - this.fov / 2);
            } else {
                ray.angle =  this.rotation + Math.PI / 2;
            }

            ray.point = {
                x: this.x + this.rays.sight * Math.cos(ray.angle), 
                y: this.y + this.rays.sight * Math.sin(ray.angle),
            }
            
            // Sort bounds by whichever one the current ray hits first.
            bounds.sort((a, b) => {
                let aPoint = this.rayIntersection(ray, a),
                    bPoint = this.rayIntersection(ray, b);
                
                if (!aPoint) return 1;
                if (!bPoint) return -1;

                let playerToA = Math.hypot(this.x - aPoint.x, this.y - aPoint.y);
                let playerToB = Math.hypot(this.x - bPoint.x, this.y - bPoint.y);
                
                return playerToA - playerToB;
            })

            let point = this.rayIntersection(ray, bounds[0]);
            if (point) ray.point = point

            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(ray.point.x, ray.point.y);
            ctx.strokeStyle = this.rayColour;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }


    /**
     * Calculates point of intersection between a ray and a bound.
     * @param {Object} ray - A line emitted from player
     * @param {Bound} bound - Objects which can block rays
     * @returns {Object} point of intersection
     */
    rayIntersection(ray, bound) {
        let r = {x: ray.point.x - this.x, y: ray.point.y - this.y};
        let s = {x: bound.x2 - bound.x1, y: bound.y2 - bound.y1};
        
        let deno = r.x * s.y - r.y * s.x;
        let u = ((bound.x1 - this.x) * r.y - (bound.y1 - this.y) * r.x) / deno;
        let t = ((bound.x1 - this.x) * s.y - (bound.y1 - this.y) * s.x) / deno;

        return (u >= 0 && u <= 1 && t >= 0 && t <= 1) && {x: this.x + r.x*t, y: this.y + r.y*t};
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

let player = new Player(canvas.width / 2, canvas.height / 2, 15),
    walls = [
        new Bound(100, 200, 200, 200), 
        new Bound(150, 100, 100, 300),
        new Bound(100, canvas.height/2, 200, canvas.height/2),
        new Bound(canvas.width/2, 300, canvas.width/2, 500),
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    walls.forEach((wall) => wall.draw());
    player.drawRay(walls);
    player.draw();
    player.movement(walls);
}

main();