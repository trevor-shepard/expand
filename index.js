import Game from './game';

document.addEventListener("DOMContentLoaded", () => {
    let playButton = document.getElementById('play-button')
    let instructionsButton = document.getElementById('instructions')    
    let toggle = () => {
        let modal = document.getElementById('explaination-modal')
        modal.classList.toggle('hidden')

        let instructions = document.getElementById('instructions')
        instructions.classList.toggle('hidden')
    }
    
    playButton.addEventListener('click', toggle)

    instructionsButton.addEventListener('click', toggle)
    
    let game = new Game();


    game.start()
})