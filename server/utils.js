module.exports = {
    makeid,
};
function makeid(length) {
    const characters = '1234567890';
    const charlen = characters.length;
    let myid = ''; 
    for(let i = 0; i < length; i++) {
      myid += characters.charAt(Math.floor(Math.random()* charlen));
    }
    return myid;
}
