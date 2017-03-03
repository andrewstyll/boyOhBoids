var canvas = document.getElementById('indexCanvas');
var ctx = canvas.getContext('2d');
var BOID_RADIUS = 100;

var BOID_WIDTH = 14;
var BOID_HEIGHT = 26;
var BOID_VEL = 10;

var NUM_BOIDS = 50;
var TICK_RATE = 50;

function Vector(x, y) {
    this.x = x;
    this.y = y;
}

Vector.prototype.add = function(vector) {
    let v = new Vector(this.x+vector.x, this.y+vector.y);
    return v;
}

function Boid(velocity, position) {
    this.velocity = velocity;
    this.position = position;
    this.height = BOID_HEIGHT;
    this.width = BOID_WIDTH;
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
    ctx.fill();

    /*ctx.beginPath();
    ctx.strokeStyle = "Orange";
    ctx.moveTo(this.position.x, this.position.y);
    ctx.lineTo(this.position.x + this.velocity.x, this.position.y + this.velocity.y);
    ctx.stroke();*/
}

function Flock() {
    this.boids = [];
}

Flock.prototype.seperation = function(boid) {
    return boid.velocity;  
}

Flock.prototype.cohesion = function(boid) {
    return boid.velocity;  
}

Flock.prototype.alignment = function(boid) {
    return boid.velocity;  
}

Flock.prototype.capVelocity = function(velocity) {
    //limit the velocity of the boids so they can't accelerate to mach10
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
        let vX = Math.random()*BOID_VEL-5;
        let vY = Math.random()*BOID_VEL-5;
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
    flock.draw();

    for(let boid of flock.boids) {
        let sep = flock.seperation(boid);
        let coh = flock.cohesion(boid);
        let ali = flock.alignment(boid);

        let newVelocity = sep.add(coh.add(ali));
        //boid.velocity = boid.velocity.add(newVelocity);
        boid.position = flock.capPosition(boid.position.add(boid.velocity));
    }
}

//moveFlock();
setInterval(moveFlock, TICK_RATE);
