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
                console.log("made it", changeStyle)
                
            }
        }
    }


}



