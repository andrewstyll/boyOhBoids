var canvas = document.getElementById('indexCanvas');
var ctx = canvas.getContext('2d');

var SEP_WEIGHT = 0.03;
var COH_WEIGHT = 0.003;
var ALI_WEIGHT = 0.03;

var BOID_RADIUS = 50;
var BOID_VEL = 4;
var BOID_MAX_VEL = BOID_VEL/2;
var BOID_MIN_DISTANCE = 30;

var BOID_WIDTH = 7;
var BOID_HEIGHT = 13;

var NUM_BOIDS = 300;
var TICK_RATE = 33;

/* VECTORS */
function Vector(x, y) {
    this.x = x;
    this.y = y;
}

Vector.prototype.add = function(vector) {
    let v = new Vector(this.x+vector.x, this.y+vector.y);
    return v;
}

Vector.prototype.subtract = function(vector) {
    let v = new Vector(this.x-vector.x, this.y-vector.y);
    return v;
}

Vector.prototype.divideByScalar = function(scalar) {
    let v = new Vector(this.x/scalar, this.y/scalar);
    return v;
}

Vector.prototype.multiplyByScalar = function(scalar) {
    let v = new Vector(this.x*scalar, this.y*scalar);
    return v;
}

Vector.prototype.pythagorean = function(x, y) {
    let sumSquares = Math.pow(this.x-x, 2) + Math.pow(this.y-y, 2);
    return Math.sqrt(sumSquares);
}

Vector.prototype.normalise = function() {
    let mag = this.pythagorean(0, 0);
    return this.divideByScalar(mag);
}

Vector.prototype.steer = function(boid) {
    let steer = this.divideByScalar(boid.neighbours.length);
    steer = steer.normalise();
    steer = steer.multiplyByScalar(BOID_MAX_VEL);
    steer = steer.subtract(boid.velocity);
    return steer;
}

/* BOIDS */
function Boid(velocity, position) {
    this.velocity = velocity;
    this.position = position;
    this.neighbours = [];
    
    this.height = BOID_HEIGHT;
    this.width = BOID_WIDTH;
}

Boid.prototype.getNeighbours = function(flock) {
    for(let boid of flock.boids) {
    //if a boid is withing the radius of this boid, it is a neighbour
    let distance = this.position.pythagorean(boid.position.x, boid.position.y);
        if(distance < BOID_RADIUS && distance > 0 && boid != this) {
            this.neighbours.push(boid);
        }
    }
}

Boid.prototype.clearNeighbours = function() {
    this.neighbours = [];
}

Boid.prototype.seperation = function() {
    let sepVel = new Vector(0, 0);
    
    if(this.neighbours.length != 0) { 
        for(let boid of this.neighbours) {
            let distance = this.position.pythagorean(boid.position.x, boid.position.y);
            if(distance < BOID_MIN_DISTANCE && distance > 0) {
                let difference = this.position.subtract(boid.position);
                difference = difference.normalise();
                difference = difference.divideByScalar(distance);
                sepVel = sepVel.add(difference);
            }
        }
        if(sepVel.pythagorean(0, 0) > 0) {
            sepVel = sepVel.steer(this);
        }
    }
    return sepVel;  
}

Boid.prototype.cohesion = function() {
    let cohVel = new Vector(0, 0);
    if(this.neighbours.length != 0) { 
        for(let boid of this.neighbours) {
            cohVel = cohVel.add(boid.position);
        }
        cohVel = cohVel.steer(this);
    }
    return cohVel;  
}

Boid.prototype.alignment = function() {
    let aliVel = new Vector(0, 0);
    if(this.neighbours.length != 0) { 
        for(let boid of this.neighbours) {
            aliVel = aliVel.add(boid.velocity);       
        }
        aliVel = aliVel.steer(this);
    }
    return aliVel;  
}

Boid.prototype.drawVector = function(vector) {
    ctx.beginPath();
    ctx.strokeStyle = "Orange";
    ctx.moveTo(this.position.x,this.position.y);
    ctx.lineTo(this.position.x + vector.x, this.position.y + vector.y);
    ctx.stroke();
}

Boid.prototype.updateBody = function() {
    //find the angle of rotation
    let x = (this.position.x + this.velocity.x) - (this.position.x-this.height);
    let y = (this.position.y + this.velocity.y) - (this) 
    //let cosB = Math.cos()   
    //let sinB = Math.sin()
}

Boid.prototype.draw = function() {
    //this.updateBody();
    ctx.beginPath();
    ctx.moveTo(this.position.x, this.position.y);
    ctx.lineTo(this.position.x-this.height, this.position.y-(this.width/2));
    ctx.lineTo(this.position.x-this.height, this.position.y+(this.width/2));
    ctx.fillStyle = "#d9d9d9";
    ctx.fill();
}

/* FLOCK */
function Flock() {
    this.boids = [];
}


Flock.prototype.capVelocity = function(velocity) {
    //limit the velocity of the boids so they can't accelerate to mach10
    let mag = velocity.pythagorean(0, 0); //returns magnitude of a vector.
    if( mag > BOID_MAX_VEL) {
    //set velocity to new value
        velocity = velocity.normalise().multiplyByScalar(BOID_MAX_VEL);
    }
    return velocity;
}

Flock.prototype.capPosition = function(position) {
    //limit the movement of the boids so that they can't just fly away :(
    if(position.x > canvas.width) {
        position.x = 0;
    } else if(position.x < 0) {
        position.x = canvas.width;
    }

    if(position.y > canvas.height) {
        position.y = 0;
    } else if(position.y < 0) {
        position.y = canvas.height;
    }
    return position;
}

Flock.prototype.initBoids = function() {
    for(let i = 0; i < NUM_BOIDS; i++) {
        let vX = Math.random()*BOID_VEL-(BOID_VEL/2);
        let vY = Math.random()*BOID_VEL-(BOID_VEL/2);
        let pX = Math.random()*canvas.width;
        let pY = Math.random()*canvas.height;
        
        let velocity = this.capVelocity(new Vector(vX, vY));
        let position = this.capPosition(new Vector(pX, pY));
        
        let boid = new Boid(velocity, position);
        this.boids.push(boid);           
    }
}

Flock.prototype.draw = function() {
    for(let boid of this.boids) {
        boid.draw();
    }
}

//Start execution here!
var flock = new Flock();
flock.initBoids();

moveFlock = function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    flock.draw();

    for(let boid of flock.boids) {
        boid.getNeighbours(flock);
        let sep = boid.seperation().multiplyByScalar(SEP_WEIGHT);
        let coh = boid.cohesion().multiplyByScalar(COH_WEIGHT);
        let ali = boid.alignment().multiplyByScalar(ALI_WEIGHT);

        let newVelocity = sep.add(coh.add(ali));
        boid.velocity = flock.capVelocity(boid.velocity.add(newVelocity));
        boid.position = flock.capPosition(boid.position.add(boid.velocity));
        boid.clearNeighbours();
    }
}

setInterval(moveFlock, TICK_RATE);
