var canvas = document.getElementById('indexCanvas');
var ctx = canvas.getContext('2d');

var SEP_WEIGHT = 0.03;
var COH_WEIGHT = 0.003;
var ALI_WEIGHT = 0.03;

var BOID_WIDTH = 7;
var BOID_HEIGHT = 13;

/* BOID VARIABLES */
var BOID_RADIUS = 50;
var BOID_VEL = 10;
var NUM_BOIDS = 300;
var TICK_RATE = 33;
var BOID_MIN_DISTANCE = 15;
var BOID_MAX_VEL = BOID_VEL/2;

/* ENVIRONMENT VARIABLES */
var BOUND_RANGE = 100;
var DRIFT_ACCEL = 0.7;
var COH_WEIGHT_MULTIPLIER = -10;

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
    
    //to be set when drawn, maybe i should init for good form?
    this.vertexA; 
    this.vertexB;
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

Boid.prototype.drawVector = function(vector, src) {
    ctx.beginPath();
    ctx.strokeStyle = "Orange";
    ctx.moveTo(src.x,src.y);
    ctx.lineTo(src.x + vector.x, src.y + vector.y);
    ctx.stroke();
}

Boid.prototype.updateBody = function() {
    let unitVel = this.velocity.normalise();//.multiplyByScalar(-1*this.height);
    let unitVelPerp1 = new Vector(unitVel.y, -1*unitVel.x);
    let unitVelPerp2 = new Vector(-1*unitVel.y, unitVel.x);
    
    let newP = unitVel.multiplyByScalar(-1*this.height).add(this.position);

    this.vertexA = newP.add(unitVelPerp1.multiplyByScalar(this.width/2));
    this.vertexB = newP.add(unitVelPerp2.multiplyByScalar(this.width/2));
}

Boid.prototype.draw = function() {
    this.updateBody();
    ctx.beginPath();
    ctx.moveTo(this.position.x, this.position.y);
    ctx.lineTo(this.vertexA.x, this.vertexA.y);
    ctx.lineTo(this.vertexB.x, this.vertexB.y);
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

Flock.prototype.boundPosition = function(position, velocity) {
    //limit the movement of the boids so that they can't just fly away :(
    if(position.x+BOUND_RANGE > canvas.width) {
        velocity.x -= DRIFT_ACCEL;
    } else if(position.x-BOUND_RANGE < 0) {
        velocity.x += DRIFT_ACCEL;
    }

    if(position.y+BOUND_RANGE > canvas.height) {
        velocity.y -= DRIFT_ACCEL;
    } else if(position.y-BOUND_RANGE < 0) {
        velocity.y += DRIFT_ACCEL;
    }
    return velocity;
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

function drawCircle(x, y) {
    ctx.beginPath();
    ctx.strokeStyle = "Orange";
    ctx.arc(x,y,50,0,2*Math.PI);
    ctx.stroke();
}

//Start execution here!
var contain = false;
var scatter = false;
var timeout;
canvas.addEventListener("click", function(event) {
    contain = !contain;
});

canvas.addEventListener("mousemove", function(event) {
    if(scatter == false) {
        COH_WEIGHT = COH_WEIGHT * COH_WEIGHT_MULTIPLIER;        
        console.log(COH_WEIGHT);
    }
    scatter = true;
    clearTimeout(timeout);
    timeout = setTimeout(function() {
        scatter = false;
        COH_WEIGHT = COH_WEIGHT / COH_WEIGHT_MULTIPLIER;
        console.log(COH_WEIGHT);
    }, 500);
});

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
        
        if(contain == true) {
            let tmpPosition = boid.position.add(newVelocity);
            newVelocity = flock.boundPosition(tmpPosition, boid.velocity.add(newVelocity));
            boid.position = boid.position.add(newVelocity);
            boid.velocity = flock.capVelocity(boid.velocity.add(newVelocity));
        } else {
            boid.velocity = flock.capVelocity(boid.velocity.add(newVelocity));
            boid.position = flock.capPosition(boid.position.add(boid.velocity));
        }

        boid.clearNeighbours();
    }
}

setInterval(moveFlock, TICK_RATE);
