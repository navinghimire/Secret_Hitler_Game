// const socket = io('http://10.0.0.138:3000');   
// socket.on('init',(id) => alert(id))

const POWER_EXAMINE_TOP_3 = 'examine_top_3';
const POWER_KILL = 'kill';
const POWER_KILL_VETO = 'kill_veto';
const POWER_PICK_PRESIDENT = 'pick_president';
const POWER_EXAMINE_MEMBERSHIP = 'examine_membership';

const LIBERAL = 'liberal';
const FASCIST = 'fascist';
const PRESIDENT = 'president';
const CHANCELLOR = 'chancellor';

const SESSION_PRESIDENCY = 'presidency';
const SESSION_ELECTION_PRIMARY = 'election_primary';
const SESSION_ELECTION_GENERAL = 'election_general';
const SESSION_LEGISLATION_PRESIDENT = 'legislation_president';
const SESSION_LEGISLATION_CHANCELLOR = 'legislation_chancellor';



class Player {
    constructor(id, name, role) {
        this.id = id;
        this.name = name;
        this.role = role;
    } 
}

const MIN_PLAYERS = 5;
const MAX_PLAYERS = 10;

class Game {
    constructor() {
        this.activePlayers = [];
        this.inactivePlayers = [];
        this.chancellor = null;
        this.president = null;
        this.pastCabinet = {president:null, chancellor:null};
        this.hitler = null;
        this.fasPolicyCount = 0;
        this.libPolicyCount = 0;
        this.totalFasPolicies = 5;
        this.totalLibPolicies = 6;
        this.fascists = [];
        this.liberals = [];
        this.drawPile = [];
        this.discardPile = [];
        this.totalFasArticles = 11;
        this.totalLibArticles = 6;
        this.topThree = [];
        this.topTwo = [];
        this.gameSession = SESSION_PRESIDENCY;
    }
    addPlayer(player) {
        if (this.numActivePlayers < MAX_PLAYERS) {
            this.activePlayers.push(player);
            return true;
        }
        return false;
    }
    removePlayer(playerIn) {
        this.activePlayers.forEach((player,id,players) => {
            if(playerIn.id === player.id) {
                players.splice(id,1);
                return true;
            }
        });
        return false;
    }
    isGameOver() {

        // 3 or more fascist policies passed and hitler elected chancellor
        if (this.fasPolicyCount >= 3 && this.hitler.id === this.chancellor.id) {
            return FASCIST;
        }
        // all fascist policies passed
        if (this.fasPolicyCount === this.totalFasPolicies) {
            return FASCIST;
            // all liberal policies passed
        } else if (this.libPolicyCount === this.totalLibPolicies) {
            return LIBERAL;
        }
        return false;
    }

    // creates a random draw pile; using totalLib and totalFas articles
    initDrawPile(totalFas) {
        let s = new Set();
        while (s.size < totalFas) {
            let randI = Math.floor(Math.random() * (this.totalLibArticles + totalFas));
            s.add(randI);

        }
        for(let i=0; i<(totalFas + this.totalLibArticles); i++) {
            if (s.has(i)) {
                this.drawPile.push(FASCIST);
            } else {
                this.drawPile.push(LIBERAL);
            }
        }
    }
    drawCards() {
        let top3 = [];
        //draw pile has 3 or more cards -> pop 3 from drawPile -> add it to 
        if (this.numDrawPile >=3) {
            for(let i = 0; i< 3;i++) {
                    let top = this.drawPile.pop();
                    top3.push(top);
            }
            this.topThree = top3;
            return top3;
        } else {
            let newDrawPile = this.discardPile;

            // shuffle the discard pile
            this.discardPile = this.discardPile.sort((a,b) => 0.5-Math.random());

            while(this.numDrawPile) {
                console.log(this.drawPile[this.numDrawPile -1]);
                newDrawPile.push(this.drawPile.pop());
            }
            this.drawPile = newDrawPile;

      
            this.discardPile = [];
            return this.drawCards();
        }

    }
    discardOne(articles, articleToDiscard) {
        if (!articles) return false;
        let ind = articles.indexOf(articleToDiscard);
        if (ind >= 0 ) {
            let discarded = articles.splice(ind,1);
            this.discardPile.push(articleToDiscard);
            return articles;
        }
        return false;
    }


    makePresident(player) {
        // set the role of existing president to null
        if (this.president) {
            this.president.role = null;
            this.pastCabinet.president = this.president;
        }
        this.president = player;
        player.role = PRESIDENT;
    }

    get nextPresident() {
        if (!this.president) {
            const randomIndex = Math.floor(Math.random() * this.numActivePlayers);
            return this.activePlayers[randomIndex];
        } else {
            let curPresId = this.getPlayerIndex(this.president);
            if (curPresId + 1 >= this.numActivePlayers) {
                return this.activePlayers[0];
            } else {
                return this.activePlayers[curPresId+1];articleToDiscard
            }
        }
    }

    getPlayerIndex(playerIn) {
        for(let i = 0; i< this.numActivePlayers; i++) {
            if(playerIn.id === this.activePlayers[i].id) {
                return i;
            }
        }
    }

    wasInLastCabinet(player) {
        if (this.pastCabinet.president) {
            if (player.id === this.pastCabinet.president.id) {return
                return true;
            }
        }
        if (this.pastCabinet.chancellor) {
            if (player.id === this.pastCabinet.chancellor.id) {
                return true;
            }
        }
        return false;
    }

    makeChancellor(playerIn) {
        // president cannot be chancellor
        if(playerIn.id === this.president.id) {
            return;
        }
        // members of last cabinet cannot be the chancellor
        if(this.wasInLastCabinet(playerIn)) {
            return;
        }

        if (this.chancellor) {
            this.chancellor.role = null;
            this.pastCabinet.chancellor = this.chancellor;
        }
        playerIn.role = CHANCELLOR;
        this.chancellor = playerIn
    }


    


    assignRandomPartyMembership() {

        // assign random player as hitler
        let randomIndex = Math.floor(Math.random() * this.numActivePlayers);
        this.fascists.push(this.activePlayers[randomIndex]);   
        this.hitler = this.activePlayers[randomIndex];

        let s = new Set();
        while(s.size < this.fascistCount-1) {
            let newIndex = Math.floor(Math.random() * this.numActivePlayers);
            if (newIndex === randomIndex) continue; //this is hitler so skip
            s.add(newIndex);
        }
        for (let i = 0; i < this.numActivePlayers; i++) {
            if (s.has(i)) {
                this.fascists.push(this.activePlayers[i]);
            } else if (i === randomIndex) {
                continue;
            } else {
                this.liberals.push(this.activePlayers[i]);
            }
        }

    }
    get numDrawPile() {
        return this.drawPile.length;
    }
    get numDiscardPile() {
        return this.discardPile.length;
    }

    get numActivePlayers() {
        return this.activePlayers.length;
    }
    get numInactivePlayers() {
        return this.inactivePlayers.length;
    }
    get fascistCount() {
        switch(this.numActivePlayers) {
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

    get fascistPresidentialPower(){
        if (this.numActivePlayers === 5 || this.numActivePlayers === 6) {
            return ({
                3: POWER_EXAMINE_TOP_3,
                4: POWER_KILL,
                5: POWER_KILL_VETO,
            });
        } else if (this.numActivePlayers === 7 || this.numActivePlayers === 8) {
            return ({
                2: POWER_EXAMINE_MEMBERSHIP,
                3: POWER_PICK_PRESIDENT,
                4: POWER_KILL,
                5: POWER_KILL_VETO,
            });

        } else if (this.numActivePlayers === 9 || this.numActivePlayers === 10) {
            return({
                1: POWER_EXAMINE_MEMBERSHIP,
                2: POWER_EXAMINE_MEMBERSHIP,
                3: POWER_PICK_PRESIDENT,
                4: POWER_KILL,
                5: POWER_KILL_VETO,
            });
        } else {
            return ({});
        }

    }


    

}

// create new game instance
game = new Game();


// add players
for(let i = 0; i< MAX_PLAYERS; i++) {
    let player = new Player(i, `Player ${i}`, null);
    game.addPlayer(player);
}
game.assignRandomPartyMembership();
// assign player roles


//ELECTION
game.makePresident(game.nextPresident);



game.makeChancellor(game.activePlayers[2]);
game.initDrawPile(game.totalFasArticles);

