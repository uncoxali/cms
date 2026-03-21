const bcrypt = require('bcryptjs');
['admin', 'editor', 'viewer'].forEach(password => {
    bcrypt.hash(password, 10).then(hash => {
        console.log(`${password}: ${hash}`);
    });
});
