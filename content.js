var FLAMOID_MAX_LEN = 15000
var FLAMOID_SYSTEM_PROMPT = "You will be given an article encased in <article/> and a selected part that is of interest encased in <selection/>. From the article and the text of focus. Output a brief 300 character description of an image that can be sent to an AI image generator that would make for a good illustration of what is being selected."
var extractText = ()=>{
    const potentialContainers = document.querySelectorAll('article, main, [class*="post"], [class*="article"], [id*="post"], [id*="article"]');
    let bestCandidate = null;
    let highestScore = 0;
  
    for (const container of potentialContainers) {
      const textContent = container.textContent.trim();
      const wordCount = textContent.split(/\s+/).length;
      const headingCount = container.querySelectorAll('h2, h3, h4, h5, h6').length;
      const mediaCount = container.querySelectorAll('img, video').length;
      const hasLists = container.querySelectorAll('ul, ol').length > 0;
      const hasBlockquotes = container.querySelectorAll('blockquote').length > 0;
  
      const score = wordCount + headingCount * 2 + mediaCount + (hasLists ? 1 : 0) + (hasBlockquotes ? 1 : 0);
      if (score > highestScore) {
        bestCandidate = container;
        highestScore = score;
      }
    }

    if (bestCandidate) {
      bestCandidate.querySelectorAll('aside, nav, header, footer, .sidebar, .ads, .comments, .related-posts').forEach(el => el.remove());
    }
  
    return bestCandidate ? bestCandidate.innerText : null;
}




var chat_complete = (key, messages, callback) =>{
  let data = {
    'model': "gpt-4o",
    'messages': messages,
    'max_tokens': 4080
  }

  fetch("https://api.openai.com/v1/chat/completions", {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(data => {
    console.log(data)
    callback(data.choices[0].message.content)
  })
  .catch(error => console.error('Error:', error));
}

var image_complete = (key, description, callback)=>{
  let data = {
    'model': "dall-e-3",
    'prompt': description,
    'n': 1,
    'size': "1024x1024"
  }

  fetch("https://api.openai.com/v1/images/generations", {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(data => {
    console.log(data)
    callback(data.data[0].url)
  })
  .catch(error => console.error('Error:', error));
}


function replaceSelectedTextWithSpan(idx) {
  const selection = window.getSelection();
  const selectedText = selection.toString();
  const span = document.createElement('span');
  
  span.id = `span_${idx}`
  span.textContent = selectedText;
  const imageEl = document.createElement('img');
  imageEl.src = "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExMm9vZHNqMzlsamR4Y2J3ZjRyMWRod3FkenNranplOTBwNzBpZHJzMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7bu3XilJ5BOiSGic/giphy.gif"
  imageEl.style.width = "100px";
  imageEl.style.height = "100px";
  imageEl.id = idx;
  span.appendChild(imageEl)
  const range = selection.getRangeAt(0);
  range.deleteContents();
  range.insertNode(span);
  return imageEl
}


chrome.storage.local.get(['apiKey'], function(result) {
  console.log("I AM RUNNING.")
  let pageContent = extractText()
  if(pageContent){
    let taskId = `flamoid_${Math.floor(Math.random()*999999)}`
    if(pageContent.length > FLAMOID_MAX_LEN){
      let excess = Math.floor((pageContent.length - FLAMOID_MAX_LEN)/2)
      pageContent = pageContent.slice(excess, excess+15000)
    }
    let selectedText =  window.getSelection().toString();
    //console.log(pageContent, selectedText)
    let imageEl = replaceSelectedTextWithSpan(taskId)
    chat_complete(result.apiKey, [
      {'role':'system', 'content':FLAMOID_SYSTEM_PROMPT}, 
      {'role':'user', 'content': `<article>${pageContent}</article>\n<selection>${selectedText}</selection>`}, 
    ], (description)=>{
      image_complete(result.apiKey, description, (url)=>{
        imageEl.src = url
        imageEl.style.width = "1024px";
        imageEl.style.height = "1024px";
      })
    })
  }else{
    alert("could not find article..")
  }
  
});
