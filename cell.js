export default class Cell {
    constructor(x, y, gird, alive = false) {
        this.x = x;
        this.y = y;
        this.grid = gird;
        this.alive = alive;
        this.visited = false;
        this.el;

        
        this.isAlive = this.isAlive.bind(this);
        this.createNode = this.createNode.bind(this);
        this.wake = this.wake.bind(this);
        this.kill = this.kill.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }

    // takes booleen value
    createNode(x) {
        let newNode = document.createElement('div')
        newNode.classList.add(`c-${x}`)
        // if (this.alive) {
        //     this.visited = true;
        //     newNode.classList.add('alive')
        //     newNode.classList.add('visited')
        // }
        newNode.classList.add('cell')
        newNode.addEventListener('click', this.handleClick)
        this.el = newNode;
        return newNode;
    }

    handleClick() {
        if (this.visited) {
            this.wake();
            this.grid.clickCount += 1;
        } 
    }

    wake() {
        this.alive = true;
        this.visited = true;
        this.el.classList.add('visited');
        this.el.classList.add('alive');
        
    }

    kill() {
        this.alive = false;
        this.el.classList.remove('alive');

    }

    isAlive() {
        return this.alive;
    }
}