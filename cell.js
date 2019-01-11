
export default class Cell {
    constructor(x, y, alive = false) {
        this.x = x;
        this.y = y;
        this.alive = alive;
        this.visited = false;
        this.el

        
        this.isAlive = this.isAlive.bind(this);
        this.createNode = this.createNode.bind(this);
        this.wake = this.wake.bind(this);
        this.kill = this.kill.bind(this);
    }

    // takes booleen value
    createNode(x) {
        let newNode = document.createElement('div')
        newNode.classList.add(`c-${x}`)
        if (this.alive) {
            this.visited = true;
            newNode.classList.add('alive')
            newNode.classList.add('visited')
        }

        newNode.addEventListener('click', this.wake)

        return newNode;
    }

    wake() {
        this.alive = true;
        this.visited = true;
    }

    kill() {
        this.alive = false;
    }

    isAlive() {
        return this.alive;
    }
}