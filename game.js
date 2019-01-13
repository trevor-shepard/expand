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
        this.running

        this.run = this.run.bind(this)
        this.end = this.end.bind(this)
    }

    run(pattern, height, width) {

        
        const board = document.getElementById('conway')

        board.innerHTML = "";

        // debugger
        let grid = new Grid(width, height, 30);

        grid.buildBoard(board, this.patterns[pattern])
        this.running = setInterval(()  =>{
            grid.cycle()
            if (grid.isWon()) {
                this.end()
                board.innerHTML = "whuuut, damn! i'm just so dang proud rn"
            }
            if (grid.isLost()){
                this.end()
                board.innerHTML = "d00d u zuk"
            }
        },
         100)
        
    }

    end() {
        clearInterval(this.running)
    }
}