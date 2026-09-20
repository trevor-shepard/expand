interface WelcomeModalProps {
  onPlay: () => void;
}

export function WelcomeModal({ onPlay }: WelcomeModalProps) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="modal-panel">
        <h2 id="welcome-title">welcome to expand</h2>
        <div className="modal-body">
          <div className="directions">
            <p>
              Click on <span className="pink">visited ■</span> to cascade your{" "}
              <span className="dark-blue">alive ■</span> across the board.
            </p>
            <p>
              You win when all <span className="light-blue">unvisited ■</span> turn into{" "}
              <span className="pink">visited ■</span>.
            </p>
            <p>
              Be careful! You lose if you run out of <span className="dark-blue">alive ■</span>{" "}
              nodes or clicks. Cascade taps on visited live cells do not spend clicks.
            </p>
          </div>
          <div className="demo-gif" aria-hidden="true" />
        </div>
        <h3 className="modal-subtitle">a little about this game</h3>
        <p className="modal-copy">
          Nodes are cellular automata governed by{" "}
          <a href="https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life">Conway&apos;s Game of Life</a>.
        </p>
        <ul className="rules-list">
          <li>Any live cell with fewer than two live neighbors dies.</li>
          <li>Any live cell with two or three live neighbors lives.</li>
          <li>Any live cell with more than three live neighbors dies.</li>
          <li>Any dead cell with exactly three live neighbors becomes alive.</li>
        </ul>
        <button type="button" className="play-button" onClick={onPlay}>Play</button>
      </div>
    </div>
  );
}
