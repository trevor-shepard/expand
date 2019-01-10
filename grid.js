import Cell from './cell'

export default class Grid {
    constructor(width, height){
        this.grid = []
        this.width = width
        this.height = height
        
        // populate a grid to specfication size with "dead" and "unvisited" Cells
        for (let y = 0; y < height; y++) {
            let row = []
            for (let x = 0; x < width; x++) {
                row.push(new Cell(x, y)) 
            }
            this.grid.push(row)
        }
        this.buildBoard = this.buildBoard.bind(this);
        this.makeMirror = this.makeMirror.bind(this);
        this.countNeighbors = this.countNeighbors.bind(this);
        this.cycle = this.cycle.bind(this);
        this.wake = this.wake.bind(this);
        this.kill = this.kill.bind(this);
    }

    // takes an arrray of tuples [x, y]
    buildBoard(parentDiv, liveNodes) {

        // iterate over grid and wake given nodes
        liveNodes.forEach((node) => {
            this.grid[node[0]][node[1]].wake()
        })

        // iterate over nodes in grid and return a divs for rows with nested divs for nodes with approperate class names
        
        for (let y = 0; y < this.height; y++)  {
            let newRow = document.createElement('div')
            newRow.id = `r-${y}`;
            for (let x = 0; x < this.width; x ++) {
                newRow.append(this.grid[y][x].createNode(x))
            }

            parentDiv.append(newRow);
        }

    
    }
    

    wake(x, y) {
        let cell = this.grid[y][x];
        cell.wake();
        
    }

    kill(x, y) {
        let cell = this.grid[y][x];
        cell.kill();
    }

    
    countNeighbors(x, y) {
        return [-1, 0, 1].reduce((count, yDelta) => {
            count += [-1, 0, 1].reduce((rowCount, xDelta) => {
                if (xDelta === 0 && yDelta === 0) {return rowCount;}
                let neighborX = x + xDelta;
                let neighborY = y + yDelta;
                if (this.outOfBounds(neighborX, neighborY)) {return rowCount;}
    
                if (this.grid[neighborY][neighborX]) {
                    rowCount ++ ;
                }
                return rowCount;
            },
            0)
            return count;
        },
        0);
    }

    outOfBounds(x, y) {
        return x < 0 || x >= this.width || y < 0 || y >= this.height;
    }
    
    makeMirror() {
        // mirror array to hold values for next cycle
        let mirror = []

        // fill mirror array with boolean values representing alive status 
        for (let y = 0; y < this.height; y++) {
            let row = []
            for (let x = 0; x < this.width; x++) {
                let cell = this.grid[y][x]
                let count = this.countNeighbors(x, y)
                let alive = cell.isAlive()

                // Determine the alive status of cell at next cycle
                if (alive && (count < 2 || count > 3)) {
                    row.push(false)
                } else if (!alive && count === 3) {
                    row.push(true)
                } else {
                    row.push(alive)
                }
            }
            mirror.push(row)
        }
        return mirror;
    }

    // takes 2d array of boolean values
    paintBoard(mirror) {
        mirror.forEach((mirrorRow, y) => {
            let divRow = document.getElementById(`r-${y}`)
            console.log(divRow)
            mirrorRow.forEach((status, x) => {
                let el = divRow.getElementsByClassName(`c-${x}`)[0]
                if (status)  {
                    console.log(el)
                    this.wake(x, y)
                    el.classList.add('visited');
                    el.classList.add('alive');
                } else {
                    this.kill(x, y)
                    el.classList.remove('alive');
                }
            })
        });
    }




    cycle() {
        let mirror = this.makeMirror();
        this.paintBoard(mirror)
        console.log("cycle")
    }
}


// test case for countNeighbors
// const a = [
//     [0, 0, 1],
//     [1, 0, 1],
//     [0, 0, 1]
// ]

// const outOfBounds = (x, y) => {
//     return x < 0 || x >= 3 || y < 0 || y >= 3
// }

// const countTest = (array, x, y) => {
//     return [-1, 0, 1].reduce((count, yDelta) => {
//         count += [-1, 0, 1].reduce((rowCount, xDelta) => {
//             if (xDelta === 0 && yDelta === 0) {return rowCount;}
//             let neighborX = x + xDelta;
//             let neighborY = y + yDelta;
//             if (outOfBounds(neighborX, neighborY)) {return rowCount;}

//             if (array[neighborY][neighborX]) {
//                 rowCount ++ ;
//             }
//             return rowCount;
//         },
//         0)
//         return count;
//     },
//     0);
// };
