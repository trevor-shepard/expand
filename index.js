import Game from './game';

document.addEventListener("DOMContentLoaded", () => {
    let playButton = document.getElementById('play-button')
    playButton.addEventListener('click', () => {
        let modal = document.getElementById('explaination-modal')
        modal.classList.toggle('hidden')
    })
    
    
    
    let game = new Game();


    game.start()
})