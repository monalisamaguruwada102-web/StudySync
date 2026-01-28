
const bcrypt = require('bcryptjs');
const password = 'joshua#$#$';
bcrypt.hash(password, 10).then(hash => {
    console.log('HASHED:', hash);
});
