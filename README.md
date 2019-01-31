<h1 align="center">
  <a href="https://conway-expand.herokuapp.com/">expand</a>
</h1>

<h4 align="center">A lightwight game built with vanilla javascript.</h4>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#how-to-use">How To Use</a> •
  <a href="#related">Related</a> •
  <a href="#license">License</a>
</p>


## Key Features

* Implementation of [Conways Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life) using OOP principles
    - Cell Class contains instance variables to maintain positin, live status, and visited status
    - Grid Class initializes to specified width and height
    - Grid Class handles lifecycle logic of cycling board to next generation of cells
    ```javascript
        countNeighbors(x, y) {
        return [-1, 0, 1].reduce((count, yDelta) => {
            count += [-1, 0, 1].reduce((rowCount, xDelta) => {
                if (xDelta === 0 && yDelta === 0) {return rowCount;}
                let neighborX = x + xDelta;
                let neighborY = y + yDelta;
                if (this.outOfBounds(neighborX, neighborY)) {return rowCount;}
                
                if (this.grid[neighborY][neighborX].isAlive()) {
                    rowCount ++ ;
                }
                return rowCount;
            },
            0)
            
            return count;
        },
        0);
    }
    ```
* Game class holds multiple levels, which initializes specific grid sizes, starting patterns, and number of allowed clicks 
* Dynamic Sizing of diffrent sized boards handled by hand written CssRule class
    - Css dynamically adjusted using CSS Adjustor written from scratch
     ```javascript
        export default class CssRule  {
            constructor(sheetName) {
                this.styleSheet
                for (let styleSheet of document.styleSheets) {
                    if (styleSheet.href.includes(sheetName)) {
                        this.styleSheet = styleSheet
                    }
                }       
                this.adjust = this.adjust.bind(this)
            }

            adjust(cssIdentifyer, changeStyle, changeValue) {
                
                for (let rule of this.styleSheet.rules) {
                    if (rule.selectorText === cssIdentifyer) {
                        rule.style[changeStyle] = changeValue;
                    }
                }
            }
        }
    ```

## How To Use

Navigate to the [live website](https://conway-expand.herokuapp.com/) or clone this repo, npm install, and run webpack.

```bash
# Clone this repository
$ git clone https://github.com/trevor-shepard/expand

# Go into the repository
$ cd expand

# Install dependencies
$ npm install

# Run webpack
$ npm run dev

# Run express server
$ node server.js
```