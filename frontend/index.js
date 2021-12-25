
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
let numPlayersElem = document.getElementById('numPlayersDisplay');
let drawPile = document.getElementById('drawPile');
let discardPile = document.getElementById('discardPile');
newGameBtn.addEventListener('click', handleNewGameBtn); 
joinGameBtn.addEventListener('click',handleJoinGameBtn);
startGameBtn.addEventListener('click', startGame);

const socket = io('http://localhost:3000');   
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 10;
// let player = {
//     name: null,
//     id: null,
//     role: null,
// }
let playerRoles;
let playerId;
let gameState;

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
socket.on('notallowed', () => createAlert('You are not allwed to do this')) ;
socket.on('gamestarted', handleGameStarted);
socket.on('playerrolesassigned',handlePlayerRoles);
socket.on('playerid', pid => playerId = pid);
var toastLiveExample = document.getElementById('liveToast')

function handlePlayerRoles(msg) {
    // player.role = msg.role;
    // console.log(player);
    playerRoles = JSON.parse(msg);

}

function createAlert(text, type, time=2000) {

    var toast = new bootstrap.Toast(toastLiveExample)
    let body = document.getElementById('toast-text');
    body.innerText = text;
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

function handleGameStarted() {

    gameScreen.style.display='block';
}

function handleClientDisconnect(id) {

    createAlert('Player left the room.', 'negtaive');
}



function handleCanStartGame() {
    // socket.emit('startgame');
    createAlert('We now have enough players. You can start the game.','positive');
    startGameBtn.classList.remove('d-none');
    startGameBtn.classList.add('d-block');

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
    createAlert('Have your friends join the game using the code ' + gameCode, 'positive');
    menuScreen.style.display = 'none';
}

function handleGameState(state){
    state = JSON.parse(state);
    console.log(state);
    gameState = state;
    // menuScreen.style.opacity = 0;
    // gameScreen.style.opacity = 1;
    // playerScreen.style.display = 'block';
    playerScreen.style.display = 'block';
    
    renderState(state);
}

function handleInit(state) {
    
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
        numPlayersElem.classList.add('bg-success');
        numPlayersElem.classList.remove('bg-danger');
        
    } else {
        numPlayersElem.classList.add('bg-danger');
        numPlayersElem.classList.remove('bg-success');
    }



    drawPile.innerText = gameState.drawPileCardCount;
    discardPile.innerText = gameState.discardPileCardCount;

    numPlayersElem.innerText = gameState.numPlayers;
    console.log(gameState);
}

// prepare dom for new gamestate
function resetElements() {
    playersSlot.innerHTML = '';
    fascistStack.innerHTML = '';
    liberalStack.innerHTML = '';
    failedPresidencyDisplay.innerText = '0';
    startGameBtn.classList.add('d-none');
    startGameBtn.classList.remove('d-block');
}




function createPlayerElement(p){

    let playerDiv = document.createElement('div');
    let playerName = document.createElement('div');
    
    playerDiv.classList.add('border','m-1','player');
    playerName.classList.add('card-body')
    playerDiv.id = p.id;
    // if (p.role) {
    //     playerDiv.classList.add(p.role);
    //     let roleTag = document.createElement('p');
    //     roleTag.innerText = p.role;
    //     playerDiv.appendChild(roleTag);
    // }
    playerDiv.appendChild(playerName);

    // if (p.id === player.id){
    //     if (player.role) {
    //         if (player.role === 'liberal') {
    //             playerDiv.classList.add('bg-success','text-white');
    //         } else if (player.role === 'fascist') {
    //             playerDiv.classList.add('bg-warning','text-white');
    //         } else if (player.role === 'hitler') {
    //             playerDiv.classList.add('bg-danger', 'text-white');
    //         }
    //     }
    // }
    // if(p.id === player.id) {
    //     playerDiv.classList.add('border-dark','border-5');
    // }
    if (playerRoles && (p.id in playerRoles)){
        if (playerRoles[p.id] === 'liberal') {
            playerDiv.classList.add('bg-success','text-white');
        } else if (playerRoles[p.id] === 'fascist') {
            playerDiv.classList.add('bg-warning','text-white');
        } else if (playerRoles[p.id] === 'hitler') {
            playerDiv.classList.add('bg-danger', 'text-white');
        }
    }
    if (playerId && (playerId === p.id)) {
        playerDiv.classList.add('border-dark','border-5');
    } 

    console.log('Start Here');
    // console.log(p.id, player.id);
    console.log(playerRoles);
    console.log(playerDiv);
    console.log('end here');
    playerName.innerHTML=p.alias;
    
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
    // player.name = alias;
    socket.emit('joingame', JSON.stringify(msg));
}
function startGame(){
    alert("Game is now started");
    socket.emit('startgame');
    // gameScreen.style.opacity = 1;
}

