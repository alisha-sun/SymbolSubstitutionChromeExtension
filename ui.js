function createSymbolDisplay(symbolName, symbol){
	let container = document.createElement("div");
	container.className = "symbolDisplay HBox";
	container.dataset.symbolName = symbolName;

	let child = document.createElement("div");
	child.className = "symbolName";
	child.textContent = ":" + symbolName + ":";
	container.appendChild(child);

	child= document.createElement("div");
	child.className = "symbol";
	child.textContent = symbol;
	container.appendChild(child);

	child = document.createElement("button");
	child.textContent = "x";
	container.appendChild(child);

	return container;
}

function appendSymbolDisplay(element){
	const symbolDisplays = symbolsContainer.children;
	for (const other of symbolDisplays){
		let comp = element.dataset.symbolName.localeCompare(other.dataset.symbolName);
		if (comp <= 0){
			symbolsContainer.insertBefore(element, other);
			if (comp == 0) other.remove();
			return;
		}
	}
	symbolsContainer.appendChild(element);
}

function search(){
	let prefix = symbolSearch.value;
	const symbolDisplays = symbolsContainer.children;
	for (const s of symbolDisplays){
		setSymbolDisplayVisibility(s, prefix);
	}
}

function setSymbolDisplayVisibility(symbolDisplay, prefix){
	if (symbolDisplay.dataset.symbolName.startsWith(prefix)){
		symbolDisplay.style.display = "";
	}
	else{
		symbolDisplay.style.display = "none";
	}
}

async function exportSymbols(){
	try{
		const symbols_object = await chrome.storage.local.get(null);
		const blob = new Blob([JSON.stringify(symbols_object, null, 4)], {type: "text/plain"} );

		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = "symbols.json";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}catch (error){
		console.log("Export failed: " + error);
	}
}

async function importSymbols(){
	console.log("import");
	const file = fileInput.files[0];
	const json = await file.text();
	const obj = JSON.parse(json);

	if (typeof(obj) !== "object") return;
	if (Array.isArray(obj)) return;
	if (obj === null) return;

	for (const [key, value] of Object.entries(obj)) {
		if (typeof(key) !== "string" || typeof(value) !== "string") return;
	}

	await chrome.storage.local.clear();
	await chrome.storage.local.set(obj);

	symbolsContainer.innerHTML = "";

	const symbols_sorted = Object.entries(obj).sort((a,b) => { a[0].localeCompare(b[0]) });
	for (const symbol of symbols_sorted){
		symbolsContainer.appendChild(createSymbolDisplay(symbol[0], symbol[1]));
	}

	await messageAllTabs({type: "replaceAll", symbols: obj});
}