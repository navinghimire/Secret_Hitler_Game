
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
let alertDiv = document.getElementById('alertDiv');
newGameBtn.addEventListener('click', handleNewGameBtn); 
joinGameBtn.addEventListener('click',handleJoinGameBtn);
startGameBtn.addEventListener('click', startGame);

const socket = io('http://localhost:3000');   
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 10;


gameScreen.style.display = 'none';
playerScreen.style.display = 'none';

// listen and hadle events from server
socket.on('init',handleInit);
socket.on('gamecode', handleGameCode);
socket.on('gamestate', handleGameState);
socket.on('unknownroom', handleUnknowGame);
socket.on('noalias', handleNoAlias);
socket.on('newplayerjoined', playerName => {createAlert(playerName + ' has joined the game','neutral')});
socket.on('clientdisconnect', handleClientDisconnect);
socket.on('canstartgame', handleCanStartGame);
socket.on('notenoughplayers', minPlayers => createAlert('Not enough players. Need ' + minPlayers, 'negative'));


var toastLiveExample = document.getElementById('liveToast')

function createAlert(text, type, time=2000) {

    var toast = new bootstrap.Toast(toastLiveExample)

    toast.show()
    // let div = document.createElement('div');
    // div.classList.add('alert');
    // div.innerText = text;
    // if(type === 'positive') {
    //     div.classList.add('alert-success');

    // } else if (type==='neutral'){
    //     div.classList.add('alert-info');

    // } else if (type==='negative'){
    //     div.classList.add('alert-danger');
    // } else {
    //     div.classList.add('alert-secondary');
    // }
    // alertDiv.appendChild(div);


    // requestAnimationFrame( () => {
    //     div.classList.remove('faded-out');
    // });
   
    // const timeout = setTimeout(()=> {

    // }, time);
}

function handleClientDisconnect(id) {

    createAlert('Player left the room.', 'negtaive');
}



function handleCanStartGame() {
    socket.emit('startgame');
    createAlert('As a host, you can now start the game','positive');
    
    // alert("I now can start game");
}
function handleNoAlias() {
    createAlert("Need an alias name",'negative');
}
function handleUnknowGame() {
    createAlert("Game Room not available",'negative');
}



function handleGameCode(gameCode) {
    gameCodeDisplay.innerHTML = gameCode;
    createAlert('Have your friends join the came using the code ' + gameCode, 'positive');
    menuScreen.style.display = 'none';
}

function handleGameState(state){
    state = JSON.parse(state);
    // menuScreen.style.opacity = 0;
    // gameScreen.style.opacity = 1;
    // playerScreen.style.display = 'block';
    playerScreen.style.display = 'block';
    
    renderState(state);
}

function handleInit(state) {
    // renderState(JSON.parse(state));
    startGameBtn.disabled = true;
    // gameScreen.style.opacity = 0;
    // playerScreen.style.display = 'none';
    
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
    
    if (state.players.length >= MIN_PLAYERS) {
        startGameBtn.disabled = false;
        startGameBtn.classList.add('btn-success');            
        startGameBtn.classList.remove('btn-secondary');
    } else {
        startGameBtn.disabled = true;
    }

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
    let playerName = document.createElement('div');
    
    playerDiv.classList.add('alert','alert-info','border','m-2');
    playerName.classList.add('card-body')
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
    gameScreen.style.display='block';
    // gameScreen.style.opacity = 1;

}