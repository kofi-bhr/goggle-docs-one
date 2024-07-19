// Import the Google Generative AI library
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the API (Make sure to set your API key in the environment variables)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Game state
let gameState = {
    name: "",
    age: 5,
    stats: {
        netWorth: 0,
        income: 0,
        job: "Student",
        maritalStatus: "Single",
        ricePurityScore: 100,
        looks: 0,
        luck: 0,
        strength: 0,
        health: 0,
        happiness: 0,
        discipline: 0
    },
    history: []
};

// Function to initialize the game
async function initializeGame() {
    await updateUI("Welcome to your new life. What should I call you?");
    // Wait for user input
    const name = await getUserInput();
    gameState.name = name;
    
    // Initialize random stats
    gameState.stats.looks = Math.floor(Math.random() * 100);
    gameState.stats.luck = Math.floor(Math.random() * 100);
    gameState.stats.strength = Math.floor(Math.random() * 100);
    gameState.stats.health = Math.floor(Math.random() * 100);
    gameState.stats.happiness = Math.floor(Math.random() * 100);
    gameState.stats.discipline = Math.floor(Math.random() * 100);

    updateStats();
    await updateUI(`Okay, ${name}. Here are your starting stats. Would you like to continue, or retry?`);
    
    const choice = await getUserInput();
    if (choice.toLowerCase().includes("retry")) {
        return initializeGame();
    }

    await updateUI(`Perfect. Welcome to the world, ${name}.`);
    startGame();
}

// Function to start the game loop
async function startGame() {
    while (true) {
        await gameLoop();
    }
}

// Main game loop
async function gameLoop() {
    const eventType = Math.random() < 0.7 ? "situation" : "event";
    
    if (eventType === "situation") {
        await handleSituation();
    } else {
        await handleEvent();
    }

    updateStats();
}

// Function to handle situations
async function handleSituation() {
    const prompt = `You are an AI running a life simulation game. The player's name is ${gameState.name} and they are ${gameState.age} years old. Their current stats are: ${JSON.stringify(gameState.stats)}. Generate a situation for the player to respond to, similar to the game BitLife. The situation should be appropriate for their age and current life circumstances. Present the situation and ask for the player's response. The response should be open-ended, allowing the player to type their own action.`;

    const result = await model.generateContent(prompt);
    const situation = result.response.text();

    await updateUI(situation);

    const playerResponse = await getUserInput();
    
    // Process the player's response and update the game state
    const updatePrompt = `Based on the player's response "${playerResponse}" to the situation "${situation}", update the player's stats. Return a JSON object with the updated stats and a brief description of the outcome.`;

    const updateResult = await model.generateContent(updatePrompt);
    const update = JSON.parse(updateResult.response.text());

    gameState.stats = { ...gameState.stats, ...update.stats };
    await updateUI(update.outcome);
}

// Function to handle events
async function handleEvent() {
    const prompt = `Generate a random event for a life simulation game. The player's name is ${gameState.name} and they are ${gameState.age} years old. Their current stats are: ${JSON.stringify(gameState.stats)}. The event should be appropriate for their age and current life circumstances. Describe the event and its impact on the player's stats. Return a JSON object with the event description and updated stats.`;

    const result = await model.generateContent(prompt);
    const event = JSON.parse(result.response.text());

    gameState.stats = { ...gameState.stats, ...event.stats };
    await updateUI(event.description);
}

// Function to update the UI with game content
async function updateUI(content) {
    const gameContent = document.querySelector('.game-content');
    const p = document.createElement('p');
    p.classList.add('ai-response');
    gameContent.appendChild(p);

    // Stream the text
    for (let i = 0; i < content.length; i++) {
        p.textContent += content[i];
        await new Promise(resolve => setTimeout(resolve, 20)); // Adjust speed as needed
        gameContent.scrollTop = gameContent.scrollHeight;
    }

    // Add user input field after AI response
    addUserInputField();
}

// Function to add user input field
function addUserInputField() {
    const gameContent = document.querySelector('.game-content');
    const inputDiv = document.createElement('div');
    inputDiv.classList.add('user-input');
    inputDiv.contentEditable = true;
    inputDiv.setAttribute('role', 'textbox');
    gameContent.appendChild(inputDiv);
    inputDiv.focus();

    inputDiv.addEventListener('keydown', async function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const value = this.textContent.trim();
            if (value) {
                this.contentEditable = false;
                await processUserInput(value);
            }
        }
    });
}

// Function to process user input
async function processUserInput(input) {
    // Here you would typically call your game logic functions
    // For now, we'll just pass it to the game loop
    gameState.history.push(input);
    await gameLoop();
}

// Function to get user input
function getUserInput() {
    return new Promise((resolve) => {
        const inputDiv = document.querySelector('.user-input');
        if (inputDiv) {
            inputDiv.addEventListener('keydown', function handler(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const value = this.textContent.trim();
                    if (value) {
                        this.removeEventListener('keydown', handler);
                        this.contentEditable = false;
                        resolve(value);
                    }
                }
            });
        }
    });
}

// Function to update the stats display
function updateStats() {
    const statsContent = document.querySelector('.stats-content');
    statsContent.innerHTML = `
        <p>STATS:</p>
        <p>- Age: ${gameState.age}</p>
        <p>- Net Worth: $${gameState.stats.netWorth}</p>
        <p>- Income: $${gameState.stats.income}/year</p>
        <p>- Job: ${gameState.stats.job}</p>
        <p>- Marital Status: ${gameState.stats.maritalStatus}</p>
        <p>- Rice Purity Score: ${gameState.stats.ricePurityScore}</p>
        <p>- Looks: ${gameState.stats.looks}</p>
        <p>- Luck: ${gameState.stats.luck}</p>
        <p>- Strength: ${gameState.stats.strength}</p>
        <p>- Health: ${gameState.stats.health}</p>
        <p>- Happiness: ${gameState.stats.happiness}</p>
        <p>- Discipline: ${gameState.stats.discipline}</p>
    `;
}

// Function to age up the character
async function ageUp() {
    gameState.age++;
    await updateUI(`--- Age ${gameState.age} ---`);
    updateStats();
    await gameLoop();
}

// Event listener for the Enter key to age up
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && document.activeElement.tagName !== 'DIV') {
        ageUp();
    }
});

// Start the game
initializeGame();