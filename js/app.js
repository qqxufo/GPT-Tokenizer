document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
});

function tokenizeText() {
    const inputText = document.getElementById("input-text").value;
    const tokenCount = tokenizer.countTokens(inputText);
    const characterCount = tokenizer.countCharacters(inputText);
    document.getElementById("token-count").innerHTML = tokenCount;
    document.getElementById("character-count").innerHTML = characterCount;
}

function setupEventListeners() {
    const inputTextArea = document.getElementById("input-text");
    inputTextArea.addEventListener("input", tokenizeText);
}
