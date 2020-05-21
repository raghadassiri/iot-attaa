const functions = require('firebase-functions');
const admin = require('firebase-admin');
const rp = require('request-promise');
admin.initializeApp();
const database = admin.firestore();

exports.raghadassiri = functions.pubsub.schedule('every 1 minutes').onRun((context) => {
    database.doc("timers/timer1").update({ "time": admin.firestore.Timestamp.now() });
    return null;
});

exports.getWeather = functions.https.onCall(async (data, context) => {
    const key = "project key";
    let api = `http://api.openweathermap.org/data/2.5/weather?lat=${data.latitude}&lon=${data.longitude}&appid=${key}`;
    return await rp({
        url: api,
        method: 'GET'
    }).catch((error) => console.log(error.message));
});
