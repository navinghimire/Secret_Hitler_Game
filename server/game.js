class Game {
    constructor(roomName,hostId) {
        this.numPlayers = 0;
        this.roomName = roomName;
        this.players = []
        this.hostId = hostId;
        this.num_fas_pol_passed = 0;
        this.num_lib_pol_passed = 0;
        this.draw_pile = this.getRandomPolicyDeck(6,11);
        this.discard_pile = [];
        this.president = null;
        this.chancellor = null;
        this.liberals = [];
        this.fascists = [];
        this.hitler = null;
        this.failed_presidency = 0;
    } 
    addPlayer(player) {
        this.players.push(player);
        this.numPlayers += 1;
    }
    get drawPileCardCount() {
        return this.draw_pile.length;
    }
    get discardPileCardCount() {
        return this.discard_pile.length;
    }



    drawFromPile(numCards) {
        let temp = [];
        for (let i = 0; i< numCards; i++) {
            let tempC = this.draw_pile.pop();
            temp.push(tempC);
        }
        return temp;
    }
    setRandomPresident() {
        if (this.players.length === 0) return;
        
        const pIndex = Math.floor(Math.random() * this.numPlayers);
        // console.log(pIndex);
        // console.log(this.players);
        this.players[pIndex].role = 'president';
        this.president = this.players[pIndex];
    }
    assignPlayerRoles() {

        // assign random player as hitler
        let randomIndex = Math.floor(Math.random() * this.numPlayers);
        this.fascists.push(this.players[randomIndex]);
        this.hitler = this.players[randomIndex];

        let s = new Set();
        while(s.size < this.fascistCount-1) {
            let newIndex = Math.floor(Math.random() * this.numPlayers);
            if (newIndex === randomIndex) continue;
            s.add(newIndex);
        }
        for (let i = 0; i < this.numPlayers; i++) {
            if (s.has(i)) {
                this.fascists.push(this.players[i]);
            } else if (i === randomIndex) {
                continue;
            } else {
                this.liberals.push(this.players[i]);
            }
        }

        console.log(this.liberals, this.fascists, this.hitler)

        // get liberals and fascists counts depending on the number of players

        // assign liberals

        // assign fascists
    }

    get fascistCount() {
        switch(this.numPlayers) {
            case 5:
                return 2;
            case 6:
                return 2;
            case 7:
                return 3;
            case 8:
                return 3;
            case 9:
                return 4;
            case 10: 
                return 4;
            default:
                return null;
        }
    } 

    removePlayer(playerIndex) {
        // find the player in that state
        let removeIndex = null;
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].id === playerIndex) {
                removeIndex = i;
            }
        }
        if (removeIndex) {
            this.players.splice(removeIndex,1);
            console.log('player removed!',this.players,removeIndex)
        }
        this.numPlayers -= 1;
    }

    getRandomPolicyDeck(libCount, fasCount) {
        let s = new Set();
        while(s.size <= libCount) {
            let newNum = Math.floor(Math.random()*(libCount+fasCount));
            s.add(newNum);
        }
        let returnArray = [];
        for(let i=0;i<(libCount+fasCount);i++) {
            if(s.has(i)) {
                returnArray.push('liberal');
            } else {
                returnArray.push('fascist');
            }
        }
        return returnArray;
    }

    get gameState() {
        return JSON.stringify({
            numPlayers: this.numPlayers,
            players: this.players,
            num_lib_pol_passed: this.num_lib_pol_passed,
            num_fas_pol_passed: this.num_fas_pol_passed,
            failed_presidency: this.failed_presidency,
            drawPileCardCount: this.drawPileCardCount,
            discardPileCardCount: this.discardPileCardCount,
        });
    }

}

class Player {
    constructor(alias, role, id) {
        this.id = id;
        this.alias = alias;
        this.role = role;
    }

}

module.exports.Game = Game;
module.exports.Player = Player;