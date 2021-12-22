
let canvas, ctx;
let liberalStack = document.getElementById('liberal_cards');
let fascistStack = document.getElementById('fascist_cards');
let playersSlot = document.getElementById('players_slot');
let failedPresidencyDisplay = document.getElementById('failed_presidency');
let newGameBtn = document.getElementById('newGameBtn');
let joinGameBtn = document.getElementById('joinGameBtn');
let menuScreen = document.getElementById('menuScreen');
let gameScreen = document.getElementById('gameScreen');
let playerScreen = document.getElementById('playerScreen');

let gameCodeDisplay = document.getElementById('gameCode');
let hostPlayerAlias = document.getElementById('hostPlayerAlias');
let joinGameCodeElem = document.getElementById('joinGameCode');
let joinGameAliasElem = document.getElementById('joinGameAlias');
let startGameBtn = document.getElementById('startGameBtn');
newGameBtn.addEventListener('click', handleNewGameBtn); 
joinGameBtn.addEventListener('click',handleJoinGameBtn);
startGameBtn.addEventListener('click', startGame);

const socket = io('http://localhost:3000');   

// listen and hadle events from server
socket.on('init',handleInit);
socket.on('gamecode', handleGameCode);
socket.on('gamestate', handleGameState);
socket.on('noalias', handleNoHostAlias);
socket.on('clientdisconnect', handleClientDisconnect);
socket.on('unknownroom', handleUnknowGame);
socket.on('canstartgame', handleCanStartGame);
function handleClientDisconnect(id) {
    // removePlayerElement(id);
    alert(id + ' player disconnected');
}



function handleCanStartGame() {
    startGameBtn.disabled = false;
    startGameBtn.classList.remove('btn-secondary');
    startGameBtn.classList.add('btn-success');

    
    // alert("I now can start game");
}
function handleNoHostAlias() {
    alert('Need a alias name');
}
function handleUnknowGame() {
    alert('Invalid room');
}

function handleGameCode(gameCode) {
    gameCodeDisplay.innerText = gameCode;
}

function handleGameState(state){
    state = JSON.parse(state);

    renderState(state);
}

function handleInit(state) {
    // renderState(JSON.parse(state));
    startGameBtn.disabled = true;
    socket.emit('gamestarted');

    startGameBtn.disabled = true;
}


// render game state
function renderState(state) {
    
    const numPlayers = state.players.length
    
    resetElements();
    
    // create and add players elements
    for (let player of state.players) {
        createPlayerElement(player);
    }
    
    // create and add fascist card elements
    for (let i = 0; i<state.num_fas_pol_passed; i++) {
        createCardElement('fascist');
    }
    
    // create and add liberal card elements
    for (let i = 0; i<state.num_lib_pol_passed; i++) {
        createCardElement('liberal');
    }
    failedPresidencyDisplay.innerText= state.failed_presidency;
}

// prepare dom for new gamestate
function resetElements() {
    playersSlot.innerHTML = '';
    fascistStack.innerHTML = '';
    liberalStack.innerHTML = '';
    failedPresidencyDisplay.innerText = '0';
}



function createPlayerElement(player){
    let playerDiv = document.createElement('div');
    let playerName = document.createElement('h5');
    
    playerDiv.classList.add('player');
    playerDiv.id = player.id;
    if (player.role === 'president') {
        playerDiv.classList.add('president');
        
    } else if (player.role === 'chancellor') {
        playerDiv.classList.add('chancellor');
    } 
    playerDiv.appendChild(playerName);
    playerName.innerHTML=player.alias;
    
    playersSlot.appendChild(playerDiv);
    
    
}
function removePlayerElement(id) {
    let playerElem = document.getElementById(id);
    playerElem.remove();
}

function createCardElement(type) {
    let cardDiv = document.createElement('div');
    let cardTypeElement = document.createElement('h5');
    cardDiv.classList.add('card');
    if (type === 'fascist') {
        cardTypeElement.innerHTML='Fascist Article';
    } else if (type === 'liberal') {
        cardTypeElement.innerHTML='Liberal Article';
    }
    cardDiv.appendChild(cardTypeElement);
    
    if (type === 'fascist') {
        fascistStack.appendChild(cardDiv);
        
    } else if (type === 'liberal') {
        liberalStack.appendChild(cardDiv);
    }
}





// event handers
function handleNewGameBtn(e) {
    
    let hostName = hostPlayerAlias.value;
    
    socket.emit('newgame',hostName);
}
function handleJoinGameBtn() {
    const gameCode = joinGameCodeElem.value;
    const alias = joinGameAliasElem.value;
    msg = {
        gameCode: gameCode,
        alias: alias,
    }
    socket.emit('joingame', JSON.stringify(msg));
}
function startGame(){
    alert("Game is now started");
}