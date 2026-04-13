const mysql = require('mysql2');
const webpush = require('web-push');
const schedule = require('node-schedule');

// Dane z Twojego komunikatu
const db = mysql.createConnection({
    host: 'monorail.proxy.rlwy.net',
    user: 'root',
    password: 'JmbTAmgBxEuFCIgVKSdroxlWskrlZaAS',
    database: 'railway', // Domyślna nazwa bazy na Railway to często 'railway'
    port: 56355
});

const publicVapidKey = 'BHHfQ1DF-oznP52NNPCdqXLEnmm5U1i39LK_lhh6uBA29g1C9pPIDBDIxQ9jGv-gX8LDV_YHYNklGIfefS2I_Gw';
const privateVapidKey = 'XZwlfDYyEruz8fNbEGKeItfh1R3Xz_CI7-FVd5xIDuQ';

webpush.setVapidDetails('mailto:test@test.com', publicVapidKey, privateVapidKey);

console.log('Serwer uruchomiony, czekam na zadania...');

schedule.scheduleJob('* * * * *', function() {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    db.query(
        'SELECT * FROM notifications WHERE send_at <= ? AND is_sent = 0',
        [now],
        (err, results) => {
            if (err) {
                console.error('Błąd bazy:', err);
                return;
            }

            results.forEach(row => {
                try {
                    const sub = JSON.parse(row.subscription_json);
                    const payload = JSON.stringify({
                        title: 'Przypomnienie!',
                        body: row.message_text
                    });

                    webpush.sendNotification(sub, payload)
                        .then(() => {
                            db.query('UPDATE notifications SET is_sent = 1 WHERE id = ?', [row.id]);
                            console.log('Wysłano powiadomienie:', row.message_text);
                        })
                        .catch(err => console.error('Błąd Web Push:', err));
                } catch (e) {
                    console.error('Błąd parsowania JSON subskrypcji');
                }
            });
        }
    );
});
