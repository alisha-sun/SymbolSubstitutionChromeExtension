const symbolsContainer = document.getElementById("symbols");
const symbolNameInput = document.getElementById("symbolName");
const symbolInput = document.getElementById("symbol");
const symbolSearch = document.getElementById("search");
const fileInput = document.getElementById("fileInput");

initialize();

/* FUNCTIONS */

async function initialize(){
	const symbols_object = await chrome.storage.local.get(null);
	const symbols_sorted = Object.entries(symbols_object).sort((a,b) => { a[0].localeCompare(b[0]) });
	for (const symbol of symbols_sorted){
		symbolsContainer.appendChild(createSymbolDisplay(symbol[0], symbol[1]));
	}
	symbolsContainer.addEventListener("click", (event) => {
		if (event.target.tagName === "BUTTON"){
			tryRemoveSymbol(event.target.parentNode, event.target.parentNode.dataset.symbolName);
		}
	});

	document.getElementById("addSymbol").addEventListener("click", tryAddSymbol);
	symbolSearch.addEventListener("input", search);
	document.getElementById("import").addEventListener("click", () => { fileInput.click() });
	document.getElementById("export").addEventListener("click", exportSymbols);
	fileInput.addEventListener("change", importSymbols);
}

async function tryAddSymbol(){
	let symbolName = symbolNameInput.value;
	let symbol = symbolInput.value;
	
	if (symbolName.length == 0 || containsInvalid(symbolName)){
		return;
	}

	try{
		await chrome.storage.local.set({ [symbolName]: symbol })
		appendSymbolDisplay(createSymbolDisplay(symbolName, symbol));
		symbolNameInput.value = "";
		symbolInput.value ="";
		await messageAllTabs({type: "add", symbolName: symbolName, symbol: symbol});
	} catch (error){
		console.log("Update failed: " + error);
	}
}

async function tryRemoveSymbol(container, symbolName){
	try{
		await chrome.storage.local.remove(symbolName);
		container.remove();
		await messageAllTabs({type: "remove", symbolName: symbolName});
	}catch (error){
		console.log("Removal failed: " + error);
	}
}

async function messageAllTabs(message){
	let tabs = await chrome.tabs.query({});

	for (const tab of tabs){
		chrome.tabs.sendMessage(tab.id, message)
		.then(() => { console.log(tab.id + ": success") })
		.catch((error) => { console.log(tab.id + " failed: " + error); });
	}
}

function containsInvalid(str){
	return str.includes(":") || /\s/.test(str);
}