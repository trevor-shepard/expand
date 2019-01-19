import Grid from './grid'

export default class Game {
    constructor() {
        this.patterns = {
            "blinker": [[1, 0], [1, 1], [1, 2]],
            "toad": [[0, 2], [1, 2], [2, 2], [1, 1], [2, 1], [3, 1]  ],
            "beacon": [[0, 0], [0, 1], [1, 0],[1,1], [2, 2], [2, 3], [3, 2], [3, 3]],
            "pulsar": [ [ 3, 1 ], [ 4, 1 ], [ 5, 1 ], [ 9, 1 ], [ 10, 1 ], [ 11, 1 ], [ 3, 6 ], [ 4, 6 ], [ 5, 6 ], [ 9, 6 ], [ 10, 6 ], [ 11, 6 ], [ 3, 8 ], [ 4, 8 ], [ 5, 8 ], [ 9, 8 ], [ 10, 8 ], [ 11, 8 ], [ 3, 13 ], [ 4, 13 ], [ 5, 13 ], [ 9, 13 ], [ 10, 13 ], [ 11, 13 ], [ 1, 3 ], [ 1, 4 ], [ 1, 5 ], [ 6, 3 ], [ 6, 4 ], [ 6, 5 ], [ 8, 3 ], [ 8, 4 ], [ 8, 5 ], [ 13, 3 ], [ 13, 4 ], [ 13, 5 ], [ 1, 9 ], [ 1, 10 ], [ 1, 11 ], [ 6, 9 ], [ 6, 10 ], [ 6, 11 ], [ 8, 9 ], [ 8, 10 ], [ 8, 11 ], [ 13, 9 ], [ 13, 10 ], [ 13, 11 ] ],
            'glider-right-down': [[0, 0], [1, 1], [2, 1], [0, 2], [1, 2]]
        }

        this.levels = {
            0: ["blinker", 4, 4, 5],
            1: ['toad', 5, 5, 7],
            2: ['beacon', 13, 10, 30],
            3: ['glider-right-down', 15, 15, 25],
            4: ['pulsar', 20, 20, 20],
            5: ['beacon', 20, 20, 13],
        }

        this.levelsCompleted = 0;

        this.currentLevel = 0;

        this.running;

        this.run = this.run.bind(this);
        this.end = this.end.bind(this);
        this.start = this.start.bind(this);
        this.mountReset = this.mountReset.bind(this);
    }

    // takes array [<pattern>, <height>, <width>, <clicks>]
    start(levelNum = 0) {
        let level = this.levels[levelNum]
        this.mountReset(level)

        this.run(level)

    }

    mountReset(level) {
        let reset = document.getElementById('reset')


        let handleReset = () => {
            let loseDiv = document.getElementById('lose')
            loseDiv.classList.remove("show-message")
            this.end()
            this.run(level)
        }
        reset.addEventListener('click', handleReset)

    }

    disableNext() {
        let next = document.getElementById('next')
        next.disabled = true;
    }

    mountNext() {
        let next = document.getElementById('next')
        next.disabled = false;

        let nextLevel = this.levels[this.currentLevel + 1];

        let handleNext = () => {
            let winDiv = document.getElementById('win')
            winDiv.classList.remove("show-message")
            this.end()
            this.currentLevel += 1;
            this.run(nextLevel);
            this.mountReset(nextLevel);
            this.disableNext();
        }

        let new_next = next.cloneNode(true);
        new_next.addEventListener('click', handleNext)
        next.parentNode.replaceChild(new_next, next);

    }


    run(level) {
        const board = document.getElementById('conway')

        board.innerHTML = "";

        // debugger
        let grid = new Grid(level[1], level[2], level[3]);

        grid.buildBoard(board, this.patterns[level[0]])
        this.running = setInterval(()  =>{
            grid.cycle()
            if (grid.isWon()) {
                this.end()
                this.levelsCompleted += 1;
                this.mountNext()
                let winDiv = document.getElementById('win')
                winDiv.classList.toggle("show-message")
            }
            if (grid.isLost()){
                this.end()
                let loseDiv = document.getElementById('lose')
                loseDiv.classList.toggle("show-message")
            }
        },
        100);
    }

    end() {
        clearInterval(this.running)
    }
}