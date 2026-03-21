const bcrypt = require('bcryptjs');
const hash = '$2b$10$mJY/45f1QMJtLB4ZM2WO7eyxAFyg4l4vjq7ySjQHuWpk3erqQ.OZy';
const passwords = ['admin', 'password', '123456', 'admin123', 'nexdirect'];

(async () => {
    for (const p of passwords) {
        if (await bcrypt.compare(p, hash)) {
            console.log(`Found! Password is: ${p}`);
            process.exit(0);
        }
    }
    console.log('Not found.');
})();
