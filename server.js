const mysql = require('mysql2');
const webpush = require('web-push');
const schedule = require('node-schedule');

// 1. Konfiguracja bazy danych
const db = mysql.createConnection({
    host: 'sql301.infinityfree.com',
    user: 'if0_38923294',
    password: 'jYqxl9gPgl3',
    database: 'if0_38923294_push', // Zmień XXX na właściwą nazwę
    port: 3306
});

// 2. Konfiguracja VAPID (Wygeneruj własne: npx web-push generate-vapid-keys)
const publicVapidKey = 'BHHfQ1DF-oznP52NNPCdqXLEnmm5U1i39LK_lhh6uBA29g1C9pPIDBDIxQ9jGv-gX8LDV_YHYNklGIfefS2I_Gw';
const privateVapidKey = 'XZwlfDYyEruz8fNbEGKeItfh1R3Xz_CI7-FVd5xIDuQ';

webpush.setVapidDetails('mailto:test@test.com', publicVapidKey, privateVapidKey);

// 3. Sprawdzanie bazy co 1 minutę
schedule.scheduleJob('* * * * *', function() {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    console.log('Sprawdzam powiadomienia do wysłania...');

    db.query(
        'SELECT * FROM notifications WHERE send_at <= ? AND is_sent = 0',
        [now],
        (err, results) => {
            if (err) throw err;

            results.forEach(row => {
                const sub = JSON.parse(row.subscription_json);
                const payload = JSON.stringify({
                    title: 'Przypomnienie!',
                    body: row.message_text
                });

                webpush.sendNotification(sub, payload)
                    .then(() => {
                        db.query('UPDATE notifications SET is_sent = 1 WHERE id = ?', [row.id]);
                        console.log('Wysłano:', row.message_text);
                    })
                    .catch(err => console.error('Błąd wysyłki:', err));
            });
        }
    );
});