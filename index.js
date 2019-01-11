// import Grid from './grid';
import Game from './game';

const patterns = {
    "blinker": [[1, 0], [1, 1], [1, 2]],
    "toad": [[0, 2], [1, 2], [2, 2], [1, 1], [2, 1], [3, 1]  ],
    "beacon": [[0, 0], [0, 1], [1, 0],[1,1], [2, 2], [2, 3], [3, 2], [3, 3]],
    "pulsar": [ [ 3, 1 ], [ 4, 1 ], [ 5, 1 ], [ 9, 1 ], [ 10, 1 ], [ 11, 1 ], [ 3, 6 ], [ 4, 6 ], [ 5, 6 ], [ 9, 6 ], [ 10, 6 ], [ 11, 6 ], [ 3, 8 ], [ 4, 8 ], [ 5, 8 ], [ 9, 8 ], [ 10, 8 ], [ 11, 8 ], [ 3, 13 ], [ 4, 13 ], [ 5, 13 ], [ 9, 13 ], [ 10, 13 ], [ 11, 13 ], [ 1, 3 ], [ 1, 4 ], [ 1, 5 ], [ 6, 3 ], [ 6, 4 ], [ 6, 5 ], [ 8, 3 ], [ 8, 4 ], [ 8, 5 ], [ 13, 3 ], [ 13, 4 ], [ 13, 5 ], [ 1, 9 ], [ 1, 10 ], [ 1, 11 ], [ 6, 9 ], [ 6, 10 ], [ 6, 11 ], [ 8, 9 ], [ 8, 10 ], [ 8, 11 ], [ 13, 9 ], [ 13, 10 ], [ 13, 11 ] ],
    'glider-right-down': [[0, 0], [1, 1], [2, 1], [0, 2], [1, 2]]
}

document.addEventListener("DOMContentLoaded", () => {
    
    // const conway = document.getElementById('conway')

    // let grid = new Grid(10, 4)

    // grid.buildBoard(conway, patterns["blinker"])
    // setInterval(grid.cycle, 100)
    let game = new Game();
    game.run("pulsar", 15, 30)



})

