class Cube {
    constructor({ faceSize, x, y }) {
        this.faceSize = faceSize;
        this.x = x;
        this.y = y;

    }

    contains({ x, y }) {
        const trueX = this.x + this.faceSize / 2;
        const trueY = this.y + this.faceSize / 2;


        if (x > trueX - this.faceSize / 2 &&
            x < trueX + this.faceSize / 2 &&
            y > trueY - this.faceSize / 2 &&
            y < trueY + this.faceSize / 2) {
            return true;
        };
    }
}


class Snake {
    constructor(cube, orientation, pace, maxX, maxY, minFaceSize) {
        this.ringPointer = cube;
        this.lastRing = true;
        this.orientation = orientation;
        this.previousCommand = orientation;
        this.pace = pace;
        this.maxY = maxY;
        this.maxX = maxX;
        this.minFaceSize = minFaceSize;
    }

    contains(fruit) {
        if (this.ringPointer.contains(fruit)) {
            return true;
        }
    }

    snakeContains(cube) {
        if (this.ringPointer.contains(cube)) return true;
        if (!this.lastRing) return this.nextRing.snakeContains(cube);
        return false;
    }

    getFaceSize() {
        return this.ringPointer.faceSize;
    }

    addRing() {
        if (!this.lastRing) {
            this.nextRing.addRing();
            return;
        }

        const newRing = { faceSize: this.ringPointer.faceSize }

        switch (this.orientation) {
            case "h-r":
                newRing.x = this.ringPointer.x - this.pace;
                newRing.y = this.ringPointer.y;
                break;
            case "h-l":
                newRing.x = this.ringPointer.x + this.pace;
                newRing.y = this.ringPointer.y;
                break;
            case "v-u":
                newRing.x = this.ringPointer.x;
                newRing.y = this.ringPointer.y + this.pace;
                break;
            case "v-d":
                newRing.x = this.ringPointer.x;
                newRing.y = this.ringPointer.y - this.pace;
                break;
        };

        this.nextRing = new Snake(new Cube(newRing), this.orientation, this.pace, this.maxX, this.maxY, this.minFaceSize);
        this.lastRing = false;
    }

    returnSnake(arrayOfRings = []) {
        arrayOfRings.push({ x: this.ringPointer.x, y: this.ringPointer.y, faceSize: this.ringPointer.faceSize, orientation: this.orientation });
        if (this.lastRing) { return arrayOfRings; };
        return this.nextRing.returnSnake(arrayOfRings);
    }

    returnTail() {
        if (this.lastRing) return { x: this.ringPointer.x, y: this.ringPointer.y, faceSize: this.ringPointer.faceSize, orientation: this.orientation };
        return this.nextRing.returnTail();
    }

    returnHead() {
        return { x: this.ringPointer.x, y: this.ringPointer.y, faceSize: this.ringPointer.faceSize, orientation: this.orientation };;
    }

    returnSnakePosition(arrayOfPositions = []) {
        arrayOfPositions.push({ x: this.ringPointer.x, y: this.ringPointer.y });
        if (this.lastRing) { return arrayOfPositions; };
        return this.nextRing.returnSnakePosition(arrayOfPositions);
    }

    killSnake() {
        this.nextRing = undefined;
        this.lastRing = true;
        this.ringPointer.x = this.maxX / 2;
        this.ringPointer.y = this.maxY / 2;
    }

    walk(newOrientation) {
        const previousX = this.ringPointer.x;
        const previousY = this.ringPointer.y;

        switch (newOrientation) {
            case "h-r":
                if (this.orientation != "h-l") {
                    this.ringPointer.x = this.ringPointer.x + this.pace;
                    this.orientation = newOrientation;
                } else {
                    this.ringPointer.x = this.ringPointer.x - this.pace;
                }
                break;
            case "h-l":
                if (this.orientation != "h-r") {
                    this.ringPointer.x = this.ringPointer.x - this.pace;
                    this.orientation = newOrientation;
                } else {
                    this.ringPointer.x = this.ringPointer.x + this.pace;
                }
                break;
            case "v-u":
                if (this.orientation != "v-d") {
                    this.ringPointer.y = this.ringPointer.y - this.pace;
                    this.orientation = newOrientation;
                } else {
                    this.ringPointer.y = this.ringPointer.y + this.pace;
                }
                break;
            case "v-d":
                if (this.orientation != "v-u") {
                    this.ringPointer.y = this.ringPointer.y + this.pace;
                    this.orientation = newOrientation;
                } else {
                    this.ringPointer.y = this.ringPointer.y - this.pace;
                }
                break;
        };

        if ((this.ringPointer.x >= this.maxX || this.ringPointer.y >= this.maxY) || (this.ringPointer.x < 0 || this.ringPointer.y < 0)) {
            this.ringPointer.x = previousX;
            this.ringPointer.y = previousY;
            return true;
        }


        if (!this.lastRing) this.nextRing.walk(this.previousCommand);
        this.previousCommand = newOrientation;
    }
}


class GameController {
    constructor(Snake, orientation, updateFrequency, walkFrequency, canvas, pontuationMarker) {
        this.Snake = Snake;
        this.SnakeFaceSize = this.Snake.getFaceSize()
        this.fruitFaceSize = this.SnakeFaceSize / 3;
        this.snakeOrientation = orientation
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.updateFrequency = updateFrequency;
        this.walkFrequency = walkFrequency;
        this.pontuationMarker = pontuationMarker;
        this.points = 0;

        this.commands = {
            ArrowUp: () => { this.changeDirection("v-u") },
            ArrowDown: () => { this.changeDirection("v-d") },
            ArrowLeft: () => { this.changeDirection("h-l") },
            ArrowRight: () => { this.changeDirection("h-r") }
        }
    }

    startIntervals() {
        this.walkInterval = setInterval(() => {
            this.clearRects(this.Snake.returnSnake());
            this.snakeWalk(this.snakeOrientation);
            
            const snake = this.Snake.returnSnake();
            const head = snake.shift();
            this.render([head], "#800080");
            this.render(snake, "#000");

            if (this.verifyCollision()) {
                this.gameOver();
            };
            if (this.points === 100) {
                this.gameWon();
            };
            if (this.Snake.contains(this.fruit)) {
                this.points++
                this.pontuationMarker.innerHTML = this.points;
                this.addFruit();
                this.addToSnake();
            };

        }, this.walkFrequency);

        this.updateInterval = setInterval(() => {
            this.clearRects(this.Snake.returnSnake());
            const snake = this.Snake.returnSnake();
            const head = snake.shift();
            this.render([head], "#800080");
            this.render(snake, "#000");
        }, this.updateFrequency);
    }

    addFruit() {
        const generatorX = Math.floor(Math.random() * this.canvas.width / this.SnakeFaceSize) * this.SnakeFaceSize;
        const generatorY = Math.floor(Math.random() * this.canvas.height / this.SnakeFaceSize) * this.SnakeFaceSize;

        const fruitX = generatorX + (this.SnakeFaceSize / 4);
        const fruitY = generatorY + (this.SnakeFaceSize / 4);

        if (!this.isCellEmpty({ x: fruitX, y: fruitY })) {
            return this.addFruit();
        };

        const fruit = { x: fruitX, y: fruitY, faceSize: this.fruitFaceSize };
        this.fruit = fruit;

        this.render([fruit], "#FF0000");
    };

    isCellEmpty(fruit) {
        if (this.Snake.snakeContains(fruit)) return false;
        return true;
    }

    verifyCollision() {
        const snake = this.Snake.returnSnakePosition();
        const head = snake.shift();
        snake.map((ring) => {
            if (JSON.stringify(head) === JSON.stringify(ring)) this.gameOver();
        })
    }

    stop() {
        clearInterval(this.updateInterval);
        clearInterval(this.walkInterval);
    }

    reset() {
        this.stop();
        const rects = this.Snake.returnSnake();
        if (this.fruit) rects.push(this.fruit);
        this.clearRects(rects);
        this.Snake.killSnake();
        const rings = this.Snake.returnSnake();
        this.points = 0;
        this.pontuationMarker.innerHTML = this.points;
        const snake = this.Snake.returnSnake();
        const head = snake.shift();
        this.render([head], "#800080");
        this.render(snake, "#000");
    }

    handleKeyPressed(event) {
        const command = controller.commands[event.key];
        if (command) command();
    }

    addToSnake(count = 1) {
        for (let i = 0; i < count; i++) {
            this.Snake.addRing();
        }
    }

    render(rects, color) {
        this.ctx.fillStyle = color;
        rects.map((rects) => { this.ctx.fillRect(rects.x, rects.y, rects.faceSize, rects.faceSize) });
    }

    renderFruit(fruit) {
        this.ctx.fillRect(fruit.x, fruit.y, fruit.faceSize, fruit.faceSize);
    }

    snakeWalk(orientation) {
        const error = this.Snake.walk(orientation);
        if (error) this.gameOver();
    }

    gameOver() {
        alert("GAME OVER");
        this.reset();
    }

    gameWon() {
        alert("GAME WON");
        this.reset();
    }

    clearRects(rects) {
        rects.map((rect) => { this.ctx.clearRect(rect.x, rect.y, rect.faceSize, rect.faceSize) });
    }

    changeDirection(newOrientation) {
        this.snakeOrientation = newOrientation;
    }

    createGrid(screenId) {
        const canvas = document.getElementById(screenId);
        const ctx = canvas.getContext("2d");
        ctx.strokeStyle = "#A8A8A8";

        for (let i = this.SnakeFaceSize; i < canvas.width; i += this.SnakeFaceSize) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke()
        }
        for (let i = this.SnakeFaceSize; i < canvas.height; i += this.SnakeFaceSize) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.stroke()
        }
    }
}



const canvas = document.getElementById("snake-screen");
const pointsMarker = document.getElementById("points-marker");
const controller = new GameController(new Snake(new Cube({ faceSize: canvas.width / 20, x: canvas.width / 2, y: canvas.height / 2 }), "h-r", canvas.width / 20, canvas.width, canvas.height, (canvas.width / 20) - 3), "h-r", 10, 90, canvas, pointsMarker);

controller.createGrid("debug-screen");

document.getElementById("start-button").onclick = () => {
    document.addEventListener('keydown', controller.handleKeyPressed);
    controller.reset();
    controller.addToSnake(2)
    controller.startIntervals();
    controller.addFruit()
};

document.getElementById("reset-button").onclick = () => {
    controller.reset();
};
