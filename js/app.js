document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
});

document.getElementById('optimize-button').addEventListener('click', handleOptimizeButtonClick);

let isOptimized = false;
let originalText = '';

function tokenizeText() {
    const inputText = document.getElementById("input-text").value;
    const tokenCount = tokenizer.countTokens(inputText);
    const characterCount = tokenizer.countCharacters(inputText);
    document.getElementById("token-count").innerHTML = tokenCount;
    document.getElementById("character-count").innerHTML = characterCount;
}

function setupEventListeners() {
    const inputTextArea = document.getElementById("input-text");
    inputTextArea.addEventListener("input", () => {
        tokenizeText();
        if (isOptimized) {
            isOptimized = false;
            updateButton();
        }
    });
}

function updateButton() {
    const optimizedTokens = document.querySelector(".optimized-tokens");
    const optimizeButton = document.getElementById('optimize-button');
    if (isOptimized) {
        optimizeButton.textContent = 'Restore & Copy';
        optimizedTokens.style.display = 'inline';
    } else {
        optimizeButton.textContent = 'Optimize & Copy';
        optimizedTokens.style.display = 'none';
    }
}

function optimizeTokenCount(inputText) {
    const optimizedText = inputText.replace(/[\u3000\n]/g, '')
        .replace(/([。？！，、；：])/g, '$1 ')
        .replace(/\s+/g, ' ')
        .replace(/( )([.,!?])/g, '$2')
        .replace(/([.,!?])([A-Za-z])/g, '$1 $2');
    return optimizedText;
}

function displayOptimizedTokenCount(originalText, optimizedText) {
    const originalTokenCount = tokenizer.countTokens(originalText);
    const optimizedTokenCount = tokenizer.countTokens(optimizedText);
    const reducedTokenCount = originalTokenCount - optimizedTokenCount;

    document.getElementById("optimized-token-count").innerHTML = reducedTokenCount;
}

async function handleOptimizeButtonClick() {
    const inputTextArea = document.getElementById('input-text');

    if (!isOptimized) {  
        originalText = inputTextArea.value;
        const optimizedText = optimizeTokenCount(originalText);
        inputTextArea.value = optimizedText;
        displayOptimizedTokenCount(originalText, optimizedText);
        tokenizeText();
        inputTextArea.select();
        await copyToClipboard(optimizedText);
    } else {
        inputTextArea.value = originalText;
        tokenizeText();
        inputTextArea.select();
        await copyToClipboard(originalText);
    }
    isOptimized = !isOptimized;
    updateButton();
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        console.log('Text copied to clipboard');
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
}
