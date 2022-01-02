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
let drawnCardDisplay = document.getElementById('drawnCardsDisplay');
let displayElem = document.getElementById('drawnCards');
// let drawPile = document.getElementById('drawPile');
// let discardPile = document.getElementById('discardPile');

let numLibPolDisplay = document.getElementById('numLibPolicies');
let numFasPolDisplay = document.getElementById('numFasPolicies');
let voteDisplay = document.getElementById('voteD');

newGameBtn.addEventListener('click', handleNewGameBtn); 
joinGameBtn.addEventListener('click',handleJoinGameBtn);
startGameBtn.addEventListener('click', startGame);

const socket = io('http://localhost:3000');   
const MIN_PLAYERS = 5;
const MAX_PLAYERS = 10;
const POWER_EXAMINE_TOP_3 = 'examine_top_3';
const POWER_KILL = 'kill';
const POWER_KILL_VETO = 'kill_veto';
const POWER_PICK_PRESIDENT = 'pick_president';
const POWER_EXAMINE_MEMBERSHIP = 'examine_membership';

// let player = {
//     name: null,
//     id: null,
//     role: null,
// }
let playerRoles;
let playerId;
let gameState;
let countdown = 0;
let selectedPlayer = null;
// gameScreen.style.display = 'none';

playerScreen.style.display = 'none';

// listen and hadle events from server
socket.on('init',handleInit);
socket.on('gamecode', handleGameCode);
socket.on('gamestate', handleGameState);
socket.on('unknownroom', handleUnknowGame);
socket.on('noalias', handleNoAlias);
socket.on('newplayerjoined', handleNewPlayerJoined);
socket.on('clientdisconnect', handleClientDisconnect);
socket.on('canstartgame', handleCanStartGame);
socket.on('notenoughplayers', minPlayers => createAlert('Not enough players. Need ' + minPlayers, 'bg-info'));
socket.on('notallowed', () => createAlert('You are not allwed to do this', 'bg-danger')) ;
socket.on('gamestarted', handleGameStarted);
socket.on('playerrolesassigned',handlePlayerRoles);
socket.on('playerid', pid => playerId = pid);
socket.on('inprogress', () => createAlert('Game already in progress', 'bg-danger'));
socket.on('presidentpicked', president => createAlert(JSON.parse(president).alias + ' is the president now.'));
socket.on('pickchancellor', handlePickChancellor);
socket.on('someonevoted', handleSomeOneVoted);
socket.on('discardone',handleDiscardOne);
socket.on('countdown', time => {
    document.getElementById('timerText').innerText = time;
});
socket.on('votechancellor', handleVoteChancellor);
socket.on('everyonevoted',() => createAlert('Everyone has voted'));
socket.on('failedpresidency', () => { createAlert('Presidency failed, electing next president.')})
socket.on('chancellorelected', chancellor => {
    chancellor = JSON.parse(chancellor);
    createAlert(chancellor.alias + ' is our new chancellor');
});  
socket.on('chancellorpicked', chancellorElect => {
    chancellorElect = JSON.parse(chancellorElect);
    createAlert(chancellorElect.alias + ' was choosen as chancellor candidate');
});  

socket.on(POWER_EXAMINE_TOP_3, handlePresidentialPower);
let policiesOnHand;
hideElement('gameScreen');
hideElement('dragAndDrop');


function handlePresidentialPower(topCards) {
    topCards = JSON.parse(topCards);
    alert('We have some presidential power');
    let top3Card = `
        <h3>These are the 3 cards on top of draw pile. </h3>
        <div id ='top3' class='container d-flex m-2'>
            
        </div>
    `;
    voteDisplay.innerHTML = '';
    showElement('voteD');
    voteDisplay.innerHTML = top3Card;

    let top3 = document.getElementById('top3');
    
    let htmlCode = '';
    topCards.forEach((card) => {
        htmlCode += `
        <div class = 'card ${card === 'liberal'?'bg-success':'bg-danger'}'>
            <h4>${card}</h4>
        </div>`;
    });
    top3.innerHTML = htmlCode;
    voteDisplay.append(top3);
    setTimeout(() => {
        voteDisplay.innerHTML = '';
    }, 5000)

}


function handleNewPlayerJoined(player) {

    player = JSON.parse(player);
    let playerElement = document.getElementById(player.id);
    playerElement.style.opacity = '0';
    playerElement.style.transform = 'scale(0)';
    setTimeout(() => {
        playerElement.style.opacity = '1';
        playerElement.style.transform = 'scale(1)';
    },0);

    createAlert(player.alias + ' has joined the game.');
}


function handleSomeOneVoted(votes) {
    votes = JSON.parse(votes);

    // let newElement = document.getElementById(votes);
    // let newDiv = document.createElement('p');
    // newDiv.innerHTML = votes[vote];
    // newElement.appendChild(newDiv);
}
function handleDiscardOne(policies) {

    

    showElement('drawnCardsDisplay');

    policies = JSON.parse(policies);
    policiesOnHand = policies;
    
    displayElem.innerHTML = '';
    for(let i = 0; i < policies.length; i++) {
        let policy = policies[i];
        let policyBtn = document.createElement('div');
        policyBtn.classList.add('col-auto');
        let btn = document.createElement('button');
        btn.classList.add('card',policy==='liberal'?'bg-success':'bg-danger');
        btn.id = i;
        btn.innerText = policy + ' article';
        btn.onclick = function() { discardCard.call(this, i)};
        policyBtn.appendChild(btn);
        displayElem.appendChild(policyBtn);
    }
}

function discardCard(id) {
    let remaining = policiesOnHand.splice(id,1);
    
    displayElem.innerHTML = '';
    
    hideElement('drawnCardsDisplay');

    socket.emit('onediscarded', JSON.stringify(policiesOnHand));
    
}



function hideElement(id) {
    let elem = document.getElementById(id);
    elem.classList.remove('d-block');
    elem.classList.add('d-none');
}

function showElement(id) {
    let elem = document.getElementById(id);
    elem.classList.add('d-block');
    elem.classList.remove('d-none');
}

function handleVoteChancellor(player) {
    let chancellorElect = JSON.parse(player);
    let voteCard = `
    <div class="vote border p-2 d-block">
    <div class="timer">
        <p class='border' id='timerText'>10</p>
    </div>
    <div class="row w-100">
        <h5>Do you accept <span>${chancellorElect.alias}</span> as your new chancellor?</h5>
    </div>
    <div class="row" >
        <div class="col-3">
            <button type='button' class='btn btn-success' onclick="handleVote('yes')">YES!</button>
        </div>
        <div class="col-3">
            <button type='button' class='btn btn-danger' onclick="handleVote('no')">NO!</button>
        </div>
    </div>
    </div>
    `;

    voteDisplay.innerHTML = voteCard;
    showElement('voteD');
    
}
function handleVote(res) {
    hideElement('voteD');
    socket.emit('voted', JSON.stringify(res));

}
function handlePickChancellor() {
    createAlert('Pick a chancellor');    
}
function handlePlayerRoles(msg) {

    playerRoles = JSON.parse(msg);
    
}


function createAlert(text, type ='positive', time=5000) {
    
    // var toast = new bootstrap.Toast(toastLiveExample)
    // let body = document.getElementById('toast-text');
    // body.innerText = text;
    
    alertDiv.classList.add('animated');
    let div = document.createElement('div');
    div.classList.add('alert','w-auto', 'animated');
    div.innerText = text;
    if(type === 'positive') {
        div.classList.add('alert-success');

    } else if (type==='neutral'){
        div.classList.add('alert-info');

    } else if (type==='negative'){
        div.classList.add('alert-danger');
    } else {
        div.classList.add('alert-secondary');
    }
    alertDiv.appendChild(div);
    div.style.opacity = '0';

    setTimeout(() => {
        div.style.opacity = '1';
        
    }, 0)
    const timeout = setTimeout(()=> {
        div.style.opacity = '0';
        setTimeout(() => {
            div.remove();
            
        }, 1000);
    }, time);
}

function handleGameStarted() {
    showElement('gameScreen');
    hideElement('gameCodeBlock');
}

function handleClientDisconnect(player) {
    player = JSON.parse(player);
    let playerElement = document.getElementById(player.id);
    // playerElement.style.opacity = '1';
    playerElement.style.transform = 'scale(1)';
    setTimeout(() => {
        // playerElement.style.opacity = '0';
        playerElement.style.transform = 'scale(0)';
        playerElement.remove();
    },1);
    createAlert(player.alias + ' left the room.', 'negtaive');
}



function handleCanStartGame() {
    // socket.emit('startgame');
    createAlert('We now have enough players. You can start the game.','positive');
    showElement('startGameBtn');

    
    // alert("I now can start game");
}
function handleNoAlias() {
    createAlert("Need an alias name",'negative');
}
function handleUnknowGame() {
    createAlert("Game Room not available",'negative');
}


function handleGameCode(gameCode) {
    gameCode = JSON.parse(gameCode);
    gameCodeDisplay.innerHTML = gameCode;
    createAlert('Have your friends join the game using the code ' + gameCode, 'positive');
    hideElement('menuScreen');
}

function handleGameState(state){
    
    state = JSON.parse(state);
    gameState = state;
    showElement('playerScreen');
    showElement('gameScreen');
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
    


    createPolicyPlaceholder();

    for(let i = 0; i< gameState.num_fas_pol_passed; i++) {
        let elem = document.getElementById('fascist'+(i+1));
        elem.classList.add('bg-danger','d-flex','justify-content-center','align-items-center');
        elem.innerText ='Fascist Article';
        elem.style.color = 'white';
    } 
    for(let i = 0; i< gameState.num_lib_pol_passed; i++) {
        let elem = document.getElementById('liberal'+(i+1));
        elem.classList.add('bg-success','d-flex','justify-content-center','align-items-center');
        elem.innerText ='Liberal Article';
        elem.style.color = 'white';
    } 
    

    failedPresidencyDisplay.innerText= state.failed_presidency;
    
    if (state.players.length >= MIN_PLAYERS) {
        numPlayersElem.classList.add('bg-success');
        numPlayersElem.classList.remove('bg-danger');
        
    } else {
        numPlayersElem.classList.add('bg-danger');
        numPlayersElem.classList.remove('bg-success');
    }
    numLibPolDisplay.innerText = gameState.num_lib_pol_passed;
    numFasPolDisplay.innerText = gameState.num_fas_pol_passed;

    

    // drawPile.innerText = gameState.drawPileCardCount;
    // discardPile.innerText = gameState.discardPileCardCount;

    numPlayersElem.innerText = gameState.numPlayers;

}
function init(){

}

function createPolicyPlaceholder() {
    for (let i = 0; i<gameState.num_fas_pol_to_win; i++) {
        createCardElement('fascist',i+1);
    }
    
    for (let i = 0; i<gameState.num_lib_pol_to_win; i++) {
        createCardElement('liberal',i+1);
    }

}

// prepare dom for new gamestate
function resetElements() {
    playersSlot.innerHTML = '';
    fascistStack.innerHTML = '';
    liberalStack.innerHTML = '';
    failedPresidencyDisplay.innerText = '0';
    hideElement('startGameBtn');
}



function createPlayerElement(p){

    let playerDiv = document.createElement('div');
    let playerName = document.createElement('h5');
    // playerDiv.style.height = '200px';
    // playerDiv.style.width ='150px';
    
    playerDiv.classList.add('border','p-2','m-2','player', 'd-flex','align-items-center', 'justify-content-center','flex-row');
    playerDiv.id = p.id;

    playerDiv.appendChild(playerName);

    if (playerRoles && (p.id in playerRoles)){
        if (playerRoles[p.id] === 'liberal') {
            playerDiv.classList.add('bg-success','text-white');
        } else if (playerRoles[p.id] === 'fascist') {
            playerDiv.classList.add('bg-warning','text-white');
        } else if (playerRoles[p.id] === 'hitler') {
            playerDiv.classList.add('bg-danger', 'text-white');
        }
    }

    // add border to the currentl player
    if (playerId && (playerId === p.id)) {
        playerDiv.classList.add('border-dark','border-4');
    } 

    if(p.role) {
        let roleElement = document.createElement('p');
        roleElement.classList.add(p.role,'roles');
        roleElement.innerText = p.role[0].toUpperCase();
    
        playerDiv.appendChild(roleElement);
    }


    playerName.innerHTML=p.alias;
    playerDiv.addEventListener('click', handlePlayerClick);
    playersSlot.appendChild(playerDiv);
    
    
}
function handlePlayerClick(e) {
    selectedPlayer = e.target;

    if(selectedPlayer.id) {
        socket.emit('chancellorselected', selectedPlayer.id);
    }
}
function removePlayerElement(id) {
    let playerElem = document.getElementById(id);
    playerElem.remove();
}


function createCardElement(type, pos) {
    let cardDiv = document.createElement('div');
    cardDiv.id = type + pos;
    cardDiv.classList.add('card-placeholder');
    let cardTypeElement = document.createElement('p');
    if (pos in gameState.power && type==='fascist') {
        cardDiv.classList.add(gameState.power[pos]);
        cardTypeElement.innerText = gameState.power[pos];
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
 
        socket.emit('startgame');
}

