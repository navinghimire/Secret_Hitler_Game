let canvas, ctx;

let liberalStack = document.getElementById('liberal_cards');
let fascistStack = document.getElementById('fascist_cards');
let playersSlot = document.getElementById('players_slot');
let failedPresidencyDisplay = document.getElementById('failed_presidency');

const state = {
    players: [
        {
        alias: "Navin", 
        role: 'president',
        },
        {
        alias: "Dhwani", 
        role: null,
        },
            
        {
        alias: "Sunada", 
        role: 'chancellor',
        },

    ],
    num_lib_pol_passed: 3,
    num_fas_pol_passed: 2,
    draw_pile: [],
    discard_pile: [],
    failed_presidency: 1
}
const internal_state = {
    hitler: {alias:null,role:null,},
    liberals: [],
    fascists: [],
}

function renderState(state) {

    const numPlayers = state.players.length

    for (let player of state.players) {
        createPlayerElement(player);
    }
    for (let i = 0; i<state.num_fas_pol_passed; i++) {
        createCardElement('fascist');
    }
    
    for (let i = 0; i<state.num_lib_pol_passed; i++) {
        createCardElement('liberal');
    }
    failedPresidencyDisplay.innerText= state.failed_presidency;
}
function createPlayerElement(player){
    let playerDiv = document.createElement('div');
    let playerName = document.createElement('h5');

    playerDiv.classList.add('player');

    if (player.role === 'president') {
        playerDiv.classList.add('president');

    } else if (player.role === 'chancellor') {
        playerDiv.classList.add('chancellor');
    } 

    playerDiv.appendChild(playerName);
    playerName.innerHTML=player.alias;
    
    playersSlot.appendChild(playerDiv);
    

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



// renderState(state);
function initializeGame(numPlayers) {



}
