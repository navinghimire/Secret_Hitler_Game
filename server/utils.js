module.exports = {
    makeid,
    validateName,
};
function makeid(length) {
    const characters = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const charlen = characters.length;
    let myid = ''; 
    for(let i = 0; i < length; i++) {
      myid += characters.charAt(Math.floor(Math.random()* charlen));
    }
    return myid;
    // return '1'
}

function validateName(alias) {
  if(alias.length >= 3 && alias.length <= 10) {
    return true;
  }
  return false;
}