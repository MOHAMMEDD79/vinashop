const bcrypt = require('bcrypt');

const password = 'Admin123!';
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Hash:', hash);

// Test verification
const isMatch = bcrypt.compareSync(password, hash);
console.log('Verification:', isMatch ? 'SUCCESS' : 'FAILED');