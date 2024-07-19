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
    achievements: [],
    history: []
};

// Function to initialize the game
async function initializeGame() {
    await updateUI("Welcome to your new life. What should I call you?");
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

    // Display game instructions
    await updateUI(`
Welcome to DocAdventure, ${name}!

Game Instructions:
- The "Google Docs" logo in the top left corner will take you to the actual Google Docs website
- The "Feedback" button in the top right corner will send an email with any feature requests or bugs you find
- Press SHIFT + ENTER to age up
- Type your responses below to make a choice and then press ENTER
- The "comment" on the right shows your life stats, which update as you go on
- You can unlock achievements as the game progresses

Are you ready to begin your adventure? (Type 'yes' to start)`);

    const startChoice = await getUserInput();
    if (startChoice.toLowerCase() === 'yes') {
        startGame();
    } else {
        initializeGame();
    }
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
    const prompt = `
You are an AI running a life simulation game. Generate a situation for the player to respond to.

Current game state:
${JSON.stringify(gameState, null, 2)}

Rules:
1. Format:
   - Keep responses to 1-2 lines
   - Use a tone similar to Oregon Trail's instructions
   - Clearly state the options or what the user is supposed to do
2. Content:
   - Make situations appropriate for the character's age and life circumstances
   - Include a mix of positive and negative situations
   - Occasionally reference past choices or events from the game history
3. Options:
   - Provide 2-4 clear options for the player to choose from
   - Each option should have potential consequences on the character's stats

Return a JSON object with the following structure:
{
  "text": "Situation description and options",
  "type": "situation",
  "options": ["Option 1", "Option 2", "Option 3"]
}

Do not include any additional text outside of the JSON object.`;

    const result = await model.generateContent(prompt);
    const situation = JSON.parse(result.response.text());

    await updateUI(situation.text);

    const playerChoice = await getUserInput();
    
    // Process the player's choice and update the game state
    const updatePrompt = `
Based on the player's choice "${playerChoice}" to the situation "${situation.text}", update the player's stats and generate an outcome.

Current game state:
${JSON.stringify(gameState, null, 2)}

Rules:
1. Format:
   - Keep the outcome description to 1-2 lines
   - Use a tone similar to Oregon Trail's instructions
2. Content:
   - Make the outcome logical based on the player's choice
   - Update relevant stats based on the choice and outcome
3. Stats:
   - Adjust stats in a range of -10 to +10 points
   - Ensure stats stay within the range of 0 to 100

Return a JSON object with the following structure:
{
  "text": "Outcome description",
  "stats": {
    "statName1": newValue,
    "statName2": newValue
  },
  "achievement": "New achievement unlocked" (optional)
}

Do not include any additional text outside of the JSON object.`;

    const updateResult = await model.generateContent(updatePrompt);
    const update = JSON.parse(updateResult.response.text());

    gameState.stats = { ...gameState.stats, ...update.stats };
    if (update.achievement) {
        gameState.achievements.push(update.achievement);
    }
    await updateUI(update.text);
}

// Function to handle events
async function handleEvent() {
    const prompt = `
Generate a random event for a life simulation game.

Current game state:
${JSON.stringify(gameState, null, 2)}

Rules:
1. Format:
   - Keep the event description to 1-2 lines
   - Use a tone similar to Oregon Trail's instructions
2. Content:
   - Make events appropriate for the character's age and life circumstances
   - Include a mix of positive and negative events
   - Occasionally reference past choices or events from the game history
3. Stats:
   - Adjust relevant stats based on the event
   - Changes should be in the range of -10 to +10 points
   - Ensure stats stay within the range of 0 to 100

Return a JSON object with the following structure:
{
  "text": "Event description",
  "type": "event",
  "stats": {
    "statName1": newValue,
    "statName2": newValue
  },
  "achievement": "New achievement unlocked" (optional)
}

Do not include any additional text outside of the JSON object.`;

    const result = await model.generateContent(prompt);
    const event = JSON.parse(result.response.text());

    gameState.stats = { ...gameState.stats, ...event.stats };
    if (event.achievement) {
        gameState.achievements.push(event.achievement);
    }
    await updateUI(event.text);
}

// Function to update the UI with game content
async function updateUI(content) {
    const gameContent = document.querySelector('.game-content');
    const p = document.createElement('p');
    p.classList.add('ai-response');
    p.style.fontFamily = 'Courier New, monospace';
    gameContent.appendChild(p);

    // Stream the text
    for (let i = 0; i < content.length; i++) {
        p.textContent += content[i];
        await new Promise(resolve => setTimeout(resolve, 20)); // Adjust speed as needed
        gameContent.scrollTop = gameContent.scrollHeight;
    }

    // Add two newlines and the input prompt
    const promptDiv = document.createElement('div');
    promptDiv.textContent = '\n\n>   ';
    gameContent.appendChild(promptDiv);

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
    inputDiv.style.fontFamily = 'Arial, sans-serif';
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
        <p>ACHIEVEMENTS:</p>
        ${gameState.achievements.map(a => `<p>- ${a}</p>`).join('')}
    `;
}

// Function to age up the character
async function ageUp() {
    gameState.age++;
    await updateUI(`--- Age ${gameState.age} ---`);
    updateStats();
    await gameLoop();
}

// Event listener for SHIFT + ENTER to age up
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.shiftKey && document.activeElement.tagName !== 'DIV') {
        ageUp();
    }
});

// Start the game
initializeGame();