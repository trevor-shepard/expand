import Grid from './grid';

document.addEventListener("DOMContentLoaded", () => {
    
    const conway = document.getElementById('conway')

    let grid = new Grid(20, 20)

    grid.buildBoard(conway, [[4, 1], [4, 2], [4, 3]])

})

