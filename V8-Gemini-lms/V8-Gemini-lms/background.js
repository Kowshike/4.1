chrome.commands.onCommand.addListener((command) => {
  if (command === "send-selected-text") {
    console.log('send-selected-text command received');
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length > 0) {
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          function: getSelectedText
        }, (injectionResults) => {
          if (chrome.runtime.lastError || !injectionResults || injectionResults.length === 0) {
            console.error('Error in executeScript:', chrome.runtime.lastError);
            return;
          }
          const selectedText = injectionResults[0].result;
          if (selectedText) {
            sendTextToServer(selectedText, tabs[0].id);
          } else {
            console.log("No text selected.");
          }
        });
      }
    });
  }
});

let mnCounter = 1;

function getNextMnValue() {
  const currentValue = mnCounter;
  mnCounter = mnCounter === 6 ? 1 : mnCounter + 1;
  return currentValue;
}

const mnValue = getNextMnValue();


async function getApiKey() {
  try {
    const cookie = await new Promise((resolve, reject) => {
      chrome.cookies.get({ url: "https://softpage.live/examly-ext-gemini", name: "api_key"  }, (cookie) => {
        if (chrome.runtime.lastError || !cookie) {
          reject(new Error('Error retrieving API key'));
        } else {
          resolve(cookie);
        }
      });
    });
    return cookie.value;
  } catch (error) {
    console.error('Error retrieving API key:', error);
    throw error;
  }
}
var API_Key = null;
(async () => {
  try {
    API_Key = await getApiKey();
    console.log('API Key:', API_Key);
  } catch (error) {
    console.error('Failed to retrieve API Key:', error);
  }
})();



function getSelectedText() {
  const questionElement = document.querySelector('.qtext');
  const questionText = questionElement ? questionElement.innerText : null;
  const optionsElements = Array.from(document.querySelectorAll('.answer > div'));
  const options = optionsElements.map(option => option.innerText.trim());
  const uniqueOptions = [...new Set(options)];
  
  if (questionText && uniqueOptions.length > 0) {
    let formattedText = `Question\n${questionText}\n\nOptions`;
    uniqueOptions.forEach((option, index) => {
      formattedText += `\n${index + 1}. ${option}`;
    });
    console.log('formattedText', formattedText);
    return formattedText;
  }
  
  return null;

}



function sendTextToServer(selectedText, tabId) {
  // Show loader
  chrome.scripting.executeScript({
      target: {tabId: tabId},
      function: showLoader
  });

  if(!API_Key){
    return;
  }

  var mv = getNextMnValue();
  fetch('https://api.softpage.live/api/extansbytext', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: selectedText , apiKey: API_Key , mn: mv})
  })
  .then(response => response.json())
  .then(data => {
      chrome.scripting.executeScript({
          target: {tabId: tabId},
          function: removeLoader
      });
      console.log('Code' , mv);
      console.log('Server response:', data.message);
      if (data.status) {
        const correctedResponse = data.message
        const parsedResponse = correctedResponse
          chrome.scripting.executeScript({
              target: {tabId: tabId},
              function: dimScreen,
              args: [parsedResponse.answer]
          });


          
            chrome.scripting.executeScript({
              target: {tabId: tabId},
              function: selectOption,
              args: [parsedResponse["option-number"]]
            });
            setTimeout(() => {
              chrome.scripting.executeScript({
                target: {tabId: tabId},
                function: clickNextButton
              });
            }, 1000);


          
      }
  })
  .catch(error => {
      // Remove loader
      chrome.scripting.executeScript({
          target: {tabId: tabId},
          function: removeLoader
      });

      console.error('Error sending text to server:', error);
  });
}

// function showLoader() {
//   const loader = document.createElement('div');
//   loader.id = 'loader';
//   loader.style.position = 'fixed';
//   loader.style.top = '10px'; // Position at the top right
//   loader.style.right = '10px';
//   loader.style.padding = '10px';
//   loader.style.backgroundColor = '#333'; // Dark background for visibility
//   loader.style.color = 'white';
//   loader.style.fontSize = '16px';
//   loader.style.borderRadius = '5px'; // Rounded corners
//   loader.style.zIndex = '9999'; // High z-index to ensure visibility
//   loader.innerText = 'Searching for answer...';
//   document.body.appendChild(loader);
// }

// function removeLoader() {
//   const loader = document.getElementById('loader');
//   if (loader) {
//       document.body.removeChild(loader);
//   }
// }

// function dimScreen(message) {
//   const messageBox = document.createElement('div');
//   messageBox.style.position = 'fixed';
//   messageBox.style.top = '10px'; // Position at the top right
//   messageBox.style.right = '10px';
//   messageBox.style.padding = '10px';
//   messageBox.style.backgroundColor = '#333'; // Dark background for visibility
//   messageBox.style.color = 'white';
//   messageBox.style.fontSize = '16px';
//   messageBox.style.borderRadius = '5px'; // Rounded corners
//   messageBox.style.zIndex = '9999'; // High z-index to ensure visibility
//   messageBox.innerText = message;
//   document.body.appendChild(messageBox);

//   setTimeout(() => {
//       document.body.removeChild(messageBox);
//   }, 2000); // Remove the message box after 2 seconds
// }


function clickNextButton(a) {
  console.log('clicking next button');
  const nextButtonSelector = '.mod_quiz-next-nav';  
  const nextButton = document.querySelector(nextButtonSelector);
  if (nextButton) {
    nextButton.click();
    window.onload = () => {
      const event = new KeyboardEvent('keydown', {
        key: 'g',
        altKey: true
      });
      document.dispatchEvent(event);
    };
  }
}

function selectOption(optionNumber) {
  console.log('selecting option', optionNumber);
  const optionSelector = `.answer div:nth-of-type(${optionNumber}) input[type="radio"]`;
  const option = document.querySelector(optionSelector);
  if (option) {
    setTimeout(() => {
      option.click();
    }, 500);

  }

}


function showLoader() {
const loader = document.createElement('div');
loader.id = 'loader';
loader.style.position = 'fixed';
loader.style.top = '10px'; 
loader.style.right = '10px';
loader.style.padding = '5px 10px';
// loader.style.backgroundColor = '#444'; 
// loader.style.color = '#ddd'; 
loader.style.color = 'black';
loader.style.fontSize = '12px'; 
loader.style.borderRadius = '3px'; 
loader.style.zIndex = '9999'; 
loader.innerText = '...'; 
document.body.appendChild(loader);
}

function removeLoader() {
const loader = document.getElementById('loader');
if (loader) {
    document.body.removeChild(loader);
}
}

function dimScreen(message) {
  
const messageBox = document.createElement('div');
messageBox.style.position = 'fixed';
messageBox.style.top = '10px'; 
messageBox.style.right = '10px';
messageBox.style.padding = '5px 10px'; 
// messageBox.style.backgroundColor = '#444'; 
messageBox.style.color = 'black'; 
messageBox.style.fontSize = '15px'; 
messageBox.style.borderRadius = '3px'; 
messageBox.style.zIndex = '9999'; 
messageBox.innerText = message; 
document.body.appendChild(messageBox);

setTimeout(() => {
    document.body.removeChild(messageBox);
}, 2000);
} 