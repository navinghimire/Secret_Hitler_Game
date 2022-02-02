window.onload = function() {
    initialize();

}
const socket = io();
const frmHost = document.getElementById('frmHost');
const inputAliasHost = document.getElementById('inputAliasHost');
const inputAliasJoin = document.getElementById('inputAliasJoin');

const loginScreen = document.getElementById('loginScreen');
const gameScreen = document.querySelector('.gameScreen');

const allInputElem = document.querySelectorAll('input');
const frmLogin = document.querySelectorAll('.frmLogin');

const MAX_PLAYERS = 10;
const MIN_PLAYERS = 5;
const POWER_EXAMINE_TOP_3 = 'examine_top_3';
const POWER_KILL = 'kill';
const POWER_KILL_VETO = 'kill_veto';
const POWER_PICK_PRESIDENT = 'pick_president';
const POWER_EXAMINE_MEMBERSHIP = 'examine_membership';
const LIBERAL = 'liberal';
const FASCIST = 'fascist';
const PRESIDENT = 'president';
const CHANCELLOR = 'chancellor';
const CHANCELLOR_ELECT = 'chancellor_elect';
const SESSION_INIT = 'init';
const SESSION_PRESIDENCY = 'presidency';
const SESSION_ELECTION_PRIMARY = 'election_primary';
const SESSION_ELECTION_GENERAL = 'election_general';
const SESSION_LEGISLATION_PRESIDENT = 'legislation_president';
const SESSION_LEGISLATION_CHANCELLOR = 'legislation_chancellor';
const SESSION_OVER = 'over';
const VOTE_YES = 'yes';
const VOTE_NO = 'no';

let playersElem = document.querySelector('.players');

let playerId, gameCode;
let secretRoles;
let gameState;
let choosenPlayer;
let gameCountdownElem = document.querySelector('.gameCountdown');
gameScreen.style.display = 'none';
socket.on('init', (id) => playerId = id);
socket.on('gamecode', code => {
    gameCode = code;
    gameScreen.style.display = 'grid';
    loginScreen.style.display = 'none';

});

socket.on('playerjoined', player => {
    player = JSON.parse(player);
    let playerElem = document.getElementById(player.id);
    if (playerElem) {
        gsap.from(playerElem, { duration: 1, scale: 0.1, opacity: 0 });
    }

    displayInfo(`${player.name} has joined the game`);
    setTimeout(() => {
        if (playerId === gameState.host) {
            displayInfo('gamecode');
        } else {
            displayInfo('Waiting for the host to start the game');
        }
    }, 3000);

});
socket.on('powers', powers => {
    powers = JSON.parse(powers);
    let fasSlot = document.querySelectorAll('.fascist .policies .article .front');
    let libSlot = document.querySelectorAll('.liberal .policies .article .front');
    fasSlot.forEach((elem, id) => {
        if (id + 1 in powers) {
            let imageElem = document.createElement('img');
            imageElem.classList.add('power');
            imageElem.src = `./images/powers/${powers[id+1]}.png`;
            elem.appendChild(imageElem);

        }
    })

    let trophyElemLib = document.createElement('img');
    trophyElemLib.classList.add('power');
    trophyElemLib.src = `./images/powers/trophy.png`;
    let trophyElemFas = document.createElement('img');
    trophyElemFas.classList.add('power');
    trophyElemFas.src = `./images/powers/trophy.png`;

    let fasFinal = fasSlot[gameState.totalFasPolicies - 1];
    let libFinal = libSlot[gameState.totalLibPolicies - 1];
    fasFinal.appendChild(trophyElemFas);
    libFinal.appendChild(trophyElemLib);



})
socket.on('veto_verdict', verdict => {
    let elem = document.querySelector('.actionSection>.vote');
    if (verdict === 'yes') {
        elem.remove();
    } else {
        let infoElem = document.createElement('p');
        infoElem.textContent = 'The president refused to veto the bill. You must pass a policy';
        elem.appendChild(infoElem);

    }
})

socket.on('veto', () => {
    let body = document.querySelector('.actionSection');
    const topDiv = document.createElement('div');
    topDiv.classList.add('vote');
    const divPrompt = document.createElement('div');

    let h2Elem = document.createElement('h2');
    h2Elem.innerText = 'The chancellor wants to veto the bill.';
    let h1Elem = document.createElement('h1');
    h1Elem.innerText = 'Do you agree?';
    topDiv.append(divPrompt);
    topDiv.append(yesNoElem);

    const yesNoElem = document.createElement('div');
    yesNoElem.innerHTML = `<button class='yes'>YES</button><button class='no'>NO</button>`;

    divPrompt.appendChild(h2Elem);
    divPrompt.appendChild(h1Elem);

    body.appendChild(topDiv);

    const btnYes = document.querySelector('.vote>div>button.yes');
    const btnNo = document.querySelector('.vote>div>button.no')

    btnYes.addEventListener('click', () => {
        socket.emit('veto_president', 'yes');
        topDiv.remove();

    })
    btnNo.addEventListener('click', () => {
        socket.emit('veto_president', 'no');
        topDiv.remove();
    })

})


socket.on('vote_chancellor', () => {
    displayInfo(`Vote your chancellor. There must be least ${Math.round(gameState.numActivePlayers/2)}/${gameState.numActivePlayers} votes for the election to pass`);
    if (gameState.activePlayers.map(player => player.id).filter(playerid => playerid === playerId).length === 0) {
        return;
    }
    let body = document.querySelector('section.actionSection');
    const topDiv = document.createElement('div');
    topDiv.classList.add('vote');
    const divPrompt = document.createElement('div');
    let h2Elem = document.createElement('h2');
    let h1Elem = document.createElement('h1');

    if (gameState.chancellorElect.id === playerId) {
        h2Elem.innerText = 'The Presidential Candidate has choosen you as his Chancellor';
        h1Elem.innerText = 'Do you agree to be in the cabinet?';
    } else {
        h2Elem.innerText = `The Presidential Candidate has choosen ${gameState.chancellorElect.name} as his Chancellor`;
        h1Elem.innerText = 'Do you agree on this new government?';
    }
    divPrompt.appendChild(h2Elem);
    divPrompt.appendChild(h1Elem);

    const yesNoElem = document.createElement('div');

    yesNoElem.innerHTML = `<button class='yes'>YES</button><button class='no'>NO</button>`;
    body.append(topDiv);
    topDiv.append(divPrompt);
    topDiv.append(yesNoElem);

    const btnYes = document.querySelector('.vote>div>button.yes');
    const btnNo = document.querySelector('.vote>div>button.no')

    btnYes.addEventListener('click', () => {
        socket.emit('vote', 'yes');
        gsap.to(topDiv, { duration: 1, opacity: 0, y: 100, ease: 'elastic.inOut', onComplete: removeElement, onCompleteParams: [topDiv] });

    })
    btnNo.addEventListener('click', () => {
        socket.emit('vote', 'no');
        gsap.to(topDiv, { duration: 1, opacity: 0, y: 100, ease: 'elastic.inOut', onComplete: removeElement, onCompleteParams: [topDiv] });
    })
    gsap.from(topDiv, { duration: 1, opacity: 0, y: -10, ease: 'back.out' });
})

function removeElement(elem) {
    elem.remove();
}
socket.on('randompolicy', () => {
    displayInfo('Election has failed 3 times. Passing policy at random.')
})

socket.on('policypassed', policy => {
    displayInfo(`${policy.toUpperCase()} policy passed.`);
})


socket.on('election_concluded', () => {
    if (gameState.chancellor) {
        let subj = gameState.chancellor.id === playerId ? 'You are the ' : gameState.chancellor.name + ' is our';
        let msg = (gameState.chancellor.id === playerId) ? 'The election has passed. You are the new Chancellor.' : `The election for the government has passed with simple majority. ${subj} new Chancellor`;
        displayInfo(msg);
    } else {
        displayInfo(`The election has failed.`);
    }
    let elems = document.querySelectorAll(`.player>h3`);
    elems.forEach(elem => {
        elem.classList.remove('vote', 'yes', 'no');
        elem.innerHTML = '';
    })

    let voteElem = document.querySelectorAll('.player h3.player_voted');
    voteElem.forEach(elem => {
        elem.classList.remove('player_voted', 'yes', 'no');
        elem.innerHTML = '';
    })

})

socket.on('president_choosen', () => {
    if (gameState.president.id === playerId) {
        displayInfo('You are our new Presidential Candidate.');
        setTimeout(() => {
            displayInfo('Pick your Chancellor wisely.');
        }, 5000);
    } else {
        displayInfo(`${gameState.president.name} is the new Presidental Candidate. Waiting for the president to choose a Chancellor Candidate.`);
    }

})

socket.on('choose_chancellor', eligiblePlayers => {

    eligiblePlayers = JSON.parse(eligiblePlayers);
    let emitCode = 'chancellor_choosen';
    pickOneFromPlayers(eligiblePlayers, emitCode);
})

function pickOneFromPlayers(players, emitCode) {
    players.forEach(player => {
        let playerElem = document.getElementById(player.id);
        if (playerElem) {
            setTimeout(() => {
                playerElem.classList.add('eligible');
            }, 0)
            console.log(emitCode, player.name);
            playerElem.addEventListener('click', event => handleChoose(event, emitCode));
        }
    })
}


socket.on('gameover', winner => {
    winner = JSON.parse(winner);
    let h1Elem = document.createElement('h1');
    let h2Elem = document.createElement('h2');

    let h1Text = (winner['team'] + ' won').toUpperCase();
    let h2Text;
    gameCountdownElem.innerHTML = '';
    if (winner['reason'] === 'hitler_eliminated') {
        h2Text = "Hiter was killed!";
    } else if (winner['reason'] === 'hitler_chancellor') {
        h2Text = "Hiter was elected chancellor after 3rd fascist policies were passed.";
    } else if (winner['reason'] === 'fascist_pol') {
        h2Text = "Fascist passed all the fascist policies";
    } else if (winner['reason'] === 'liberal_pol') {
        h2Text = "Liberals passed all the liberal policies";
    }
    h1Elem.innerText = h1Text;
    h2Elem.innerText = h2Text;
    gameCountdownElem.appendChild(h2Elem);
    gameCountdownElem.appendChild(h1Elem);

    gameCountdownElem.classList.add('gameover');
    gameCountdownElem.classList.add(winner['team']);
    gameCountdownElem.style.display = 'flex';

    gsap.from(h2Elem, { duration: 1, opacity: 1, y: -100 });
    gsap.from(h1Elem, { duration: 1, opacity: 1, y: 100 });


    setTimeout(() => {

        gameCountdownElem.style.display = 'none';
    }, 5000);

});

socket.on('once', (code) => {
    test(4, code);
})
socket.on('card_discarded_president', () => {
    displayInfo('President has discarded a policy and passed the remaining two policies to the chancellor');
})
socket.on('card_discarded_chancellor', () => {
    displayInfo('Chancellor has discarded a policy and the remaining policy is being passed');
})
socket.on('voted', msg => {
    msg = JSON.parse(msg);
    let player = msg['player'];
    let vote = msg['vote'];
    displayInfo(`${player.name} has voted ${vote.toUpperCase()}`);

    let playerVoted = document.getElementById(player.id);
    if (playerVoted) {
        let voteElem = playerVoted.querySelector('h3');
        if (voteElem.classList.contains('player_voted')) return;

        voteElem.classList.add('animate');
        setTimeout(() => voteElem.classList.remove('animate'), 2000);

        voteElem && (voteElem.textContent = (vote === 'yes') ? '✔' : '✘');
        voteElem && voteElem.classList.add('player_voted', vote);
    }

});

socket.on('gamecountdown', () => {
    let count = 5;
    gameCountdownElem.style.display = 'flex';
    gameCountdownElem.style.zIndex = '100';
    let timeElem = document.querySelector('.gameCountdown>h1');
    let interval = setInterval(() => {
        timeElem.textContent = count;
        count--;
        if (count < -10) {
            clearInterval(interval);
        }
    }, 100);
    let timeout = setTimeout(() => {
        gameCountdownElem.style.display = 'none';
        clearTimeout(timeout);
    }, 600);
})


socket.on('state', state => {
    gameState = JSON.parse(state);
    renderPlayerElements();

    if (gameState.numDrawPile != undefined) {
        let drawCount = document.querySelector('#drawCount')
        drawCount.textContent = gameState.numDrawPile;
    }

    if (gameState.numDiscardPile != undefined) {
        let discardCount = document.querySelector('#discardCount');
        discardCount.textContent = gameState.numDiscardPile;
    }
    let drawPileElem = document.querySelector('.drawPile');
    let discardPileElem = document.querySelector('.discardPile');
    discardPileElem.innerHTML = '';
    drawPileElem.innerHTML = '';
    for (let i = 0; i < gameState.numDrawPile; i++) {
        let card = document.createElement('div');
        card.classList.add('card');
        drawPileElem.append(card);
    }

    for (let i = 0; i < gameState.numDiscardPile; i++) {
        let card = document.createElement('div');
        card.classList.add('card');
        discardPileElem.append(card);
    }


    let totalLibElem = document.querySelector('.policy>.liberal>h1 span');
    if (totalLibElem) {
        totalLibElem.textContent = `${gameState.libPolicyCount}/${gameState.totalLibPolicies}`;
    }
    let totalFasElem = document.querySelector('.policy>.fascist>h1 span');
    if (totalFasElem) {
        totalFasElem.textContent = `${gameState.fasPolicyCount}/${gameState.totalFasPolicies}`;
    }
    let fasSlot = document.querySelectorAll('.fascist .policies .article');
    fasSlot.forEach((elem, id) => {
        if (id < gameState.fasPolicyCount) {
            elem.classList.add('passed');
        }
    })
    let libSlot = document.querySelectorAll('.liberal .policies .article');
    libSlot.forEach((elem, id) => {
        if (id < gameState.libPolicyCount) {
            elem.classList.add('passed');
        }
    })

})
socket.on('canstart', () => {
    libPolicyCount
    canStart = true;
})




socket.on('discardone', msg => {
    msg = JSON.parse(msg);
    discardPrompt(msg, 'president');
});
socket.on('discardonechancellor', msg => {
    msg = JSON.parse(msg);
    discardPrompt(msg, 'chancellor');
})

function handleVeto(elem) {

    socket.emit('veto');
    elem.remove();
}


function discardPrompt(cards, session) {

    let body = document.querySelector('.actionSection');
    const topDiv = document.createElement('div');
    topDiv.classList.add('choose_card');
    topDiv.classList.add('vote');
    const divPrompt = document.createElement('div');
    let h1Elem = document.createElement('h1');
    let h2Elem = document.createElement('h2');
    if (session === 'president') {
        h2Elem.innerText = 'These are the cards you have drawn.';
        h1Elem.innerText = 'Discard one, the remaining two will be passed to your chancellor.';
    } else if (session === 'top3') {
        h2Elem.innerText = 'These are top 3 cards in the draw pile.';
        h1Elem.innerText = 'Watch how the new cabinet votes. You can smell the foul play.';
    } else {
        h2Elem.innerText = 'President discarded one policy.';
        h1Elem.innerText = 'As a chancellor, discard one. The remaining policy will be implemented';
    }
    divPrompt.appendChild(h2Elem);
    divPrompt.appendChild(h1Elem);
    const cardsDrawn = document.createElement('div');
    cardsDrawn.classList.add('maincontainer');

    cards.forEach(card => {
        let newCardBtn = document.createElement('div');


        newCardBtn.innerHTML = `<div class='container'><div class="article ${card}">
                                    <div class="front">
                                        <h1>${card==='fascist'?'Fascist':'Liberal'}</h1>
                                        <h2>Article</h2>
                                        <img src="./images/${card}_article_line.svg" alt="" srcset="">
                                    </div>
                                    <div class="back">
                                    <h1>ARTICLE</h1>
                                </div>
                                </div></div>`;
        if (session !== 'top3') {
            newCardBtn.addEventListener('click', e => {

                let selectedElement = e.target.parentElement.parentElement;
                selectedElement.classList.add('selected');
                let restElements = document.querySelectorAll('.maincontainer>div:not(.selected)');
                console.log('Selected');
                console.log(selectedElement);
                console.log('Rest');
                console.log(restElements);
                let whereTo, fromElem;

                if (e.target) {
                    let isFascist = e.target.classList.contains('fascist') ? true : false;
                    if (!isFascist) {
                        if (session === 'president') {
                            socket.emit('card_choosen', 'liberal');
                        } else {
                            socket.emit('card_choosen_chancellor', 'liberal');

                        }
                    } else if (isFascist) {
                        if (session === 'president') {
                            socket.emit('card_choosen', 'fascist');
                        } else {
                            socket.emit('card_choosen_chancellor', 'fascist');

                        }
                    }

                    var tl = gsap.timeline();
                    tl.to(selectedElement, { duration: 1, y: 200, opacity: .0, ease: 'elastic.inoOut', onComplete: removeElement, onCompleteParams: [selectedElement] });
                    tl.to(restElements, { duration: 1, y: -10, scale: .8, ease: 'elastic.inOut', stagger: .5 });
                    tl.to(topDiv, { duration: 1, y: 200, opacity: 0, ease: 'elastic.inOut', onComplete: removeElement, onCompleteParams: [topDiv] })
                }
            });
        }
        cardsDrawn.append(newCardBtn);
    })
    body.append(topDiv);
    topDiv.append(divPrompt);
    topDiv.append(cardsDrawn);
    let vetoDiv = document.createElement('div');
    vetoDiv.innerHTML = `<div class='veto' onclick='handleVeto(this)'>${gameState.vetoPower && session != 'president' ?'<button>Exercise Veto Power</button>':''}</div>`;
    topDiv.append(vetoDiv);


    let cardsD = document.querySelectorAll('.maincontainer .article');
    gsap.fromTo(cardsD, { opacity: 0 }, { duration: 1, opacity: 1, rotationY: 180, stagger: .5, ease: 'elastic.inOut' });
    gsap.from(topDiv, { duration: 1, opacity: 0, y: -10, ease: 'back.out' });
    if (session === 'top3') {
        setTimeout(() => {
            tl.to(topDiv, { duration: 1, y: 200, opacity: 0, ease: 'elastic.inOut', onComplete: removeElement, onCompleteParams: [topDiv] })
        }, 5000);
    }

}


function initialize() {
    gsap.from('#loginScreen>section', { duration: 2, opacity: 0, x: -20, stagger: 0.25, ease: 'elastic' });
}


function displayInfo(message, type = 'info') {
    let infoElem = document.querySelector('.info');
    if (!infoElem) {
        infoElem = document.createElement('div');
        infoElem.classList.add('info');
    }
    if (message === 'gamecode') {

        infoElem.innerHTML = `<div class='info-code'>
                                <p>Game code. Pass along!</p>
                                <h1>${gameCode}</h1>
                                </div>`;
        let canStart = (playerId === gameState.host) && (!gameState.session);
        if (canStart) {
            infoElem.innerHTML += `<button onclick='startGame()'><svg width="23" height="26" viewBox="0 0 23 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M21.5 10.4019C23.5 11.5566 23.5 14.4434 21.5 15.5981L5 25.1244C3 26.2791 0.499999 24.8357 0.499999 22.5263L0.5 3.47372C0.5 1.16431 3 -0.279058 5 0.875643L21.5 10.4019Z" fill="#FEFAFA"/>
                    </svg></button>`
            infoElem.classList.add('can-start');
        } else {
            infoElem.classList.remove('can-start');
        }
    } else {
        infoElem.classList.remove('can-start');
        infoElem.innerHTML = '';

        let messageElem = document.createElement('p');
        messageElem.textContent = message;
        messageElem.classList.add('message');

        let infoIcon = document.createElement('img');
        infoIcon.src = './images/powers/trophy.png';
        infoElem.appendChild(messageElem);
        infoElem.prepend(infoIcon);
        gsap.fromTo(infoIcon, { duration: 1, repeat: -1, rotate: 10, yoyo: true, ease: 'power1.inOut' }, { duration: 1, repeat: -1, rotate: -10, yoyo: true, ease: 'power1.inOut' });
        gsap.from('.info>p', { duration: 1, opacity: 0 })
    }
}

function startGame() {
    socket.emit('startgame');

    gsap.from('.policies>.container', { duration: 2.2, x: -20, stagger: 0.2, opacity: 0, color: 'red', ease: 'elastic' });
}

function handleChoose(e, emitCode) {
    if (!emitCode) return;
    console.log(e.target);

    if (e.target.id) {
        choosenPlayer = e.target.id;
        socket.emit(emitCode, choosenPlayer);
        console.log('Emitting ', emitCode, ' and ', choosenPlayer);
        gameState.activePlayers.forEach(player => {
            let elem = document.getElementById(player.id);
            elem.classList.remove('eligible');
            elem.replaceWith(elem.cloneNode(true));
        });
    }
}




function renderPlayerElements() {
    active = gameState.activePlayers;
    inactive = gameState.inactivePlayers;

    active.forEach((player, ind) => {
        let playerElem = document.getElementById(player.id);
        if (!playerElem) {
            playerElem = document.querySelector('.players>div:not(.player,.info)')
            if (!playerElem) {
                playerElem = document.createElement('div');
                playerElem.classList.add('player');
                playerElem.id = player.id;
                let nameElem = document.createElement('h2')
                playerElem.appendChild(nameElem);
            }
            playerElem.id = player.id;
            playerElem.classList.add('player');
            let voteElem = document.createElement('h3')
            playerElem.appendChild(voteElem);
            let imageDiv = document.createElement('div');
            imageDiv.innerHTML = `
            <div class='wrapper'>        
            <div class="avatar">
                <div class="head">
                    <img src="./images/avatar/${Math.random()<0.5?'male':'female'}_head_${Math.floor(Math.random()*8)+1}.svg" alt="" srcset="">
                </div>
                <div class="cloth">
                    <img src="./images/avatar/clothes_${Math.floor(Math.random()*15)+1}.svg" alt="" srcset="">
                </div>
            </div>
            </div>
       `;
            playerElem.appendChild(imageDiv);
            if (player.id === playerId) {

                playerElem.classList.add('player-self');
            }

            let nameElem = playerElem.querySelector('h2');
            if (nameElem) {
                nameElem.textContent = player.name;
                playerElem.append(nameElem);
            }

        }

        playerElem.classList.remove('president', 'chancellor', 'chancellor_elect');

        if (gameState.president) {
            if (player.id === gameState.president.id) {
                playerElem.classList.add('president');
            }
        }
        if (gameState.chancellor) {
            if (player.id === gameState.chancellor.id) {
                playerElem.classList.add('chancellor');
            }
        } else if (gameState.chancellorElect) {
            if (player.id === gameState.chancellorElect.id) {
                playerElem.classList.add('chancellor_elect');
            }
        }
        playersElem.prepend(playerElem);

    })



    inactive.forEach(player => {
        let inactiveElem = document.getElementById(player.id);
        if (inactiveElem) {
            inactiveElem.classList.add('offline');
        }
    })
}

function renderSecretRoles(secretRoles) {
    if (secretRoles) {
        let roles = Object.keys(secretRoles);
        let n = roles.length;
        let inv = setInterval(() => {
            let player = document.getElementById(roles[n - 1]);
            if (player) {
                player.classList.add(secretRoles[roles[n - 1]]);
            }
            n--;
            if (n < 0) {
                clearInterval(inv);
            }
        }, 100);
    }
    let actionSection = document.querySelector('.actionSection');

    let secretRoleElem = document.createElement('div');


}




socket.on('pick_' + POWER_EXAMINE_MEMBERSHIP, (players) => {
    displayInfo('Pick a player whose party membership you want to view.');
    eligiblePlayers = JSON.parse(players);
    pickOneFromPlayers(eligiblePlayers, 'picked_' + POWER_EXAMINE_MEMBERSHIP);
})
socket.on('pick_' + POWER_KILL, (players) => {
    displayInfo('Pick a player you want to eleminate.');
    eligiblePlayers = JSON.parse(players);
    pickOneFromPlayers(eligiblePlayers, 'picked_' + POWER_KILL);
})

socket.on('pick_' + POWER_KILL_VETO, (players) => {
    displayInfo('Pick a player you want to eleminate. Will unlock veto');
    eligiblePlayers = JSON.parse(players);
    pickOneFromPlayers(eligiblePlayers, 'picked_' + POWER_KILL_VETO);
})
socket.on('pick_' + POWER_PICK_PRESIDENT, (players) => {
    displayInfo('This is a Special Election for President. Pick a president. WISELY');
    eligiblePlayers = JSON.parse(players);
    pickOneFromPlayers(eligiblePlayers, 'picked_' + POWER_PICK_PRESIDENT);
})


socket.on(POWER_EXAMINE_MEMBERSHIP, role => {
    displayInfo('You can now view the new role');
    role = JSON.parse(role);
    renderSecretRoles(role);
})

socket.on(POWER_KILL, player => {
    displayInfo(`${player.name} is eliminated`);
    player = JSON.parse(player);
    let playerElem = document.getElementById(player.id);
    playerElem.classList.add('eleminated');
    playerElem.classList.remove('fascist', 'liberal', 'chancellor', 'offline');
    displayInfo(`${player.name} is eliminated from the game.`);
})

socket.on(POWER_KILL_VETO, player => {
    displayInfo(`${player.name} is eliminated. Veto power now unlocked.`);
    player = JSON.parse(player);
    let playerElem = document.getElementById(player.id);
    playerElem.classList.add('eleminated');
    playerElem.classList.remove('fascist', 'liberal', 'chancellor', 'offline');
    displayInfo(`${player.name} is eliminated from the game.`);
})

socket.on(POWER_EXAMINE_TOP_3, cards => {
    cards = JSON.parse(cards);
    discardPrompt(cards, 'top3');

    let elem = document.querySelector('.actionSection>.vote');
    setTimeout(() => {
        elem.remove();
    }, 5000)
})
socket.on(POWER_PICK_PRESIDENT, player => {
    player = JSON.parse(player);
    displayInfo(`${player.name} was choosen president with veto`);
})


socket.on('secretRoles', roles => {
    secretRoles = JSON.parse(roles);
    renderSecretRoles(secretRoles);

});

let openWindows = [];
let players = ['Aditya', 'Sonali', 'Ujjar', 'Sunada', 'Dhwani', 'Prasanna', 'Prakash', 'Shyam', 'Florian']

function test(num, gameCode) {
    let height = 844;
    let width = 390;
    window.focus();
    window.moveTo(num * window, 0);
    let intv = setInterval(() => {

        let features = `resizable:no, height=${height}, width=${width}, left=${num*width+100}`;
        addOne(players.pop(), gameCode, features)
        if (num === 0) {
            clearInterval(intv)
        }
        num--;
    }, 500);
}


function closeAll() {
    openWindows.forEach(window => {
        window.close();
    });
}

function addOne(player, gameCode, features) {
    players.unshift(player);
    if (!player) {
        return;
    }


    let w = window.open('http://10.0.0.138:3000', player, features);
    w.addEventListener('DOMContentLoaded', () => {
        w.handleJoinGame(player, gameCode);
    }, false);
    openWindows.push(w);
}

function removeOne() {
    let window = openWindows.pop();
    window.close();
}

frmLogin.forEach(elem => {
    elem.addEventListener('submit', (e) => {
        e.preventDefault();
        let alias;
        let elemId = elem.id;

        let inputField = document.querySelector(`#${elemId}>.alias`);
        let messageElem = document.querySelector(`#${elemId}>.validationMessage`);
        alias = inputField.value;
        // validate alias
        if (alias.length < 3 || alias.length > 10) {
            messageElem.textContent = "You must have a better name! (3-10 chars)";
            messageElem.classList.add('d-block', 'center');

            inputField.value = '';
            return;
        }
        // validate code 
        let code = '';
        let codeInputs = document.querySelectorAll('.codeInput');
        codeInputs.forEach(elem => {
            code += elem.value;
        })
        if (elemId === 'frmJoin') {
            if (code.length < 4) {
                messageElem.textContent = 'Game code invalid';
                return
            }
        }
        if (elemId === 'frmHost') {

            handleHostGame(alias);
        } else if (elemId === 'frmJoin') {
            handleJoinGame(alias, code);
        }

    })
})
allInputElem.forEach(elem => {
    elem.addEventListener('focusin', (e) => {
        elem.select();
    });


});

function handleHostGame(alias) {

    socket.emit('hostGame', JSON.stringify(alias));
}

function handleJoinGame(alias, code) {
    let gameConfig = {
        alias: alias,
        code: code,
    }
    socket.emit('joinGame', JSON.stringify(gameConfig));

}
moveOnMax = function(field, nextFieldId) {
    if (!field) return;
    field.value = field.value.toUpperCase();
    if (field.value.length === 1) {
        const elemToFocus = document.getElementById(nextFieldId);
        if (elemToFocus) {
            elemToFocus.focus();
            elemToFocus.select();
        }
    } else {
        if (isNaN(nextFieldId)) {
            document.getElementById(3).focus();
            document.getElementById(3).select();
        }
        const elemToFocus = document.getElementById(nextFieldId - 2);
        if (elemToFocus) {
            elemToFocus.focus();
            elemToFocus.select();
        }
    }
}