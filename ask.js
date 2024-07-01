console.log(window.getSelection())

function getExtendedContextualSelection(context_length) {
    // Get the current selection
    const selection = window.getSelection();
    if (!selection.rangeCount) return null; // Return null if no text is selected

    // Get the selected text and the range object
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    // Function to expand the range to get more context
    function expandRange(range, additionalLength, isForward) {
        let currentRange = range;
        let remainingLength = additionalLength;
        while (remainingLength > 0) {
            if (isForward) {
                const endOffset = currentRange.endOffset;
                const endContainerLength = currentRange.endContainer.length || currentRange.endContainer.textContent.length;
                if (endOffset + remainingLength < endContainerLength) {
                    currentRange.setEnd(currentRange.endContainer, endOffset + remainingLength);
                    remainingLength = 0;
                } else {
                    remainingLength -= (endContainerLength - endOffset);
                    let nextSibling = currentRange.endContainer.nextSibling;
                    while (nextSibling && nextSibling.nodeType !== Node.TEXT_NODE) {
                        nextSibling = nextSibling.nextSibling;
                    }
                    if (nextSibling) {
                        currentRange.setEnd(nextSibling, 0);
                    } else {
                        break;
                    }
                }
            } else {
                const startOffset = currentRange.startOffset;
                if (startOffset - remainingLength > 0) {
                    currentRange.setStart(currentRange.startContainer, startOffset - remainingLength);
                    remainingLength = 0;
                } else {
                    remainingLength -= startOffset;
                    let previousSibling = currentRange.startContainer.previousSibling;
                    while (previousSibling && previousSibling.nodeType !== Node.TEXT_NODE) {
                        previousSibling = previousSibling.previousSibling;
                    }
                    if (previousSibling) {
                        currentRange.setStart(previousSibling, previousSibling.length);
                    } else {
                        break;
                    }
                }
            }
        }
    }

    // Calculate half of the context length to extend on both sides of the selection
    const halfContextLength = Math.floor(context_length / 2);

    // Clone the range for the context
    const contextRange = range.cloneRange();

    // Extend backward and forward to get more context
    expandRange(contextRange, halfContextLength, false); // Extend backward
    expandRange(contextRange, halfContextLength + selectedText.length, true); // Extend forward considering selected text length

    // Extract the text from the expanded range
    const contextText = contextRange.toString();

    return {
        selectedText: selectedText,
        contextText: contextText
    };
}

function getSelectionBoundingBox() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        return rect;
    } else {
        return null; // Return null if no selection is made
    }
}


async function runQuery(container, query, selectionData) {
    var closeBtn = document.createElement("div")
    closeBtn.style.position = "absolute"
    closeBtn.style.top = "0px"
    closeBtn.style.right = "0px";
    closeBtn.style.background = "#cb4545"
    closeBtn.style.width = "20px"
    closeBtn.style.height = "20px"
    closeBtn.style.margin = "5px"
    closeBtn.style.borderRadius = "10px"
    closeBtn.style.cursor = "pointer"
    closeBtn.onclick = ()=>{
        document.body.removeChild(container)
    }
    container.appendChild(closeBtn)

    var textDiv = document.createElement("p")
    textDiv.style.marginTop = "20px"
    container.appendChild(textDiv)


    if (query.length === 0){ query = "what does this mean?"}
    chrome.storage.local.get(['apiKey'], function(result) {
        const apiKey = result.apiKey;
        const url = 'https://api.openai.com/v1/chat/completions';
        const headers = new Headers({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        });
        const content = `<context>${selectionData.contextText}</context>\n<focus_on>${selectionData.selectedText}</focus_on>\nQuery: ${query}`
        const data = {
            model: "gpt-4o",
            stream: true,  
            messages: [{'role': "user", 'content': content}]  
        };

        fetch(url, {
            method: 'POST',
            headers: headers,
            mode: 'cors',
            body: JSON.stringify(data)
        })
        .then(async response => {
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            textDiv.innerText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }
                // Massage and parse the chunk of data
                const chunk = decoder.decode(value);
                const lines = chunk.split("\n");
                const parsedLines = lines
                    .map((line) => line.replace(/^data: /, "").trim()) // Remove the "data: " prefix
                    .filter((line) => line !== "" && line !== "[DONE]") // Remove empty lines and "[DONE]"
                    .map((line) => JSON.parse(line)); // Parse the JSON string
                console.log(parsedLines)
                for (const parsedLine of parsedLines) {
                    const { choices } = parsedLine;
                    const { delta } = choices[0];
                    const { content } = delta;
                    // Update the UI with the new content
                    if (content) {
                        textDiv.innerText += content;
                        console.log(textDiv.innerText)
                    }
                }
            }

        })
        .catch(err => console.error('Error:', err));
        
    })
}

var selectionData = getExtendedContextualSelection(400)
var bb = getSelectionBoundingBox()
var queryContainer = document.createElement("div")
queryContainer.style.display = "flex"
queryContainer.style.flexDirection = "column"
queryContainer.style.padding = "5px"
queryContainer.style.position = "fixed"
queryContainer.style.top = bb.bottom + "px"
queryContainer.style.left = (bb.right - 200) + "px"
queryContainer.style.width = "400px"
queryContainer.style.height = "120px"
queryContainer.style.background = "#efefefe0"
queryContainer.style.borderRadius = "5px"
queryContainer.style.fontSize = "12px"
queryContainer.style.textAlign = "center"
queryContainer.style.fontStyle = "italic"
queryContainer.innerHTML = `"${selectionData.selectedText}"`

var querybox = document.createElement("textarea")
querybox.placeholder = "What does this mean?"
querybox.style.padding = "5px"
querybox.style.fontSize = "16px"
querybox.style.fontFamily = "system-ui"
querybox.style.background = "white"
querybox.style.borderRadius = "5px"
querybox.style.width = "100%"
querybox.style.height = "100%"
queryContainer.append(querybox)
document.body.appendChild(queryContainer)

querybox.focus()
querybox.onblur = () => {
    document.body.removeChild(queryContainer)
}

querybox.onkeyup =  (e) =>{
    if(e.key === "Enter"){
        queryContainer.style.background = "rgb(245 245 245)"
        queryContainer.style.fontStyle = "normal"
        queryContainer.style.fontSize= "16px"
        queryContainer.style.height = "fit-content"
        querybox.onblur = ()=>{ console.log('overrridden')}
        queryContainer.innerHTML = ""
        runQuery(queryContainer, querybox.value, selectionData)
    }
}
console.log(bb)

