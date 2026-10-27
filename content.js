let symbols_object;
let symbols_sorted;

initialize();

/* FUNCTIONS */

async function initialize(){
    symbols_object = await chrome.storage.local.get(null);
    symbols_sorted = Object.entries(symbols_object).sort((a,b) => { a[0].localeCompare(b[0]) });

    document.addEventListener('keydown', (e) => {
        if (e.key === "ArrowRight" && !e.shiftKey && !e.ctrlKey){
            attemptAutocomplete();
        }
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === "add")
            updateSymbols_add(message.symbolName, message.symbol);
        else if (message.type === "remove")
            updateSymbols_remove(message.symbolName);
        else if (message.type === "replaceAll")
            updateSymbols_replaceAll(message.symbols);
    });
}

function attemptAutocomplete(){
    const element = document.activeElement;
    if (!element.isContentEditable) return;

    const range = window.getSelection().getRangeAt(0);
    const node = range.startContainer;

    if (node.nodeType === Node.TEXT_NODE && range.collapsed && range.startOffset === node.length){ //cursor is at the end of the text
        let ret = parseText(node.textContent);
        if (!ret) return;

        let symbol = findSymbol(ret.symbolName, ret.findExactMatch);
        if (!symbol) return;

        node.nodeValue = node.nodeValue.slice(0, ret.index) + symbol + node.nodeValue.slice(range.endOffset);

        const selection = window.getSelection();
        const newRange = document.createRange();

        newRange.setStart(node, node.length);
        newRange.collapse(true);

        selection.removeAllRanges();
        selection.addRange(newRange);
    }
}

function parseText(text){
    if (text.length < 2) return null;

    const ret = { symbolName: "", findExactMatch: false, index: 0 }

    let i = text.length - 1;
    if (text[i] === ":"){
        if (text[i-1] === ":") return null;
        ret.findExactMatch = true;
        i--;
    }
    
    for (; i >= 0; i--){
        if (text[i] == ":"){
            ret.index = i;
            return ret;
        }
        else if (/\s/.test(text[i])) return null;

        ret.symbolName = text[i] + ret.symbolName;
    }

    return null;
}

function findSymbol(symbolName, findExactMatch){
    if (findExactMatch) return symbols_object[symbolName];

    for (const symbol of symbols_sorted){
        if (symbol[0].startsWith(symbolName)) return symbol[1];
    }

    return null;
}

function updateSymbols_add(symbolName, symbol){
    symbols_object[symbolName] = symbol;

	for (let i = 0; i < symbols_sorted.length; i++){
		let comp = symbolName.localeCompare(symbols_sorted[i][0]);
		if (comp === 0){
            symbols_sorted[i][1] = symbol;
			return;
		}
        else if (comp < 0){
            symbols_sorted.splice(i, 0, [symbolName, symbol]);
            return
        }
	}
	symbols_sorted.push([symbolName, symbol]);
}

function updateSymbols_remove(symbolName){
    delete symbols_object[symbolName];

	for (let i = 0; i < symbols_sorted.length; i++){
		let comp = symbolName.localeCompare(symbols_sorted[i][0]);
		if (comp === 0){
            symbols_sorted.splice(i, 1);
			return;
		}
	}
}

function updateSymbols_replaceAll(symbols){
    symbols_object = symbols;
    symbols_sorted = Object.entries(symbols).sort((a,b) => { a[0].localeCompare(b[0]) });
}