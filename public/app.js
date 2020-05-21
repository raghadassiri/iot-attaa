
let getWeather;
const KELVIN = 273;
let db;
const weather = {};


// SELECT ELEMENTS
const iconElement = document.querySelector(".weather-icon");
const tempElement = document.querySelector(".temperature-value p");
const descElement = document.querySelector(".temperature-description p");
const locationElement = document.querySelector(".location p");
const uElement = document.querySelector("#uElement");
const notificationElement = document.querySelector(".notification");

weather.temperature = {
    unit: "celsius"
}

async function main() {
    const firebaseConfig = {
        apiKey: "project apiKey",
        authDomain: "project authDomain",
        databaseURL: "project databaseURL",
        projectId: "projectId",
        storageBucket: "project storageBucket",
        messagingSenderId: "project messagingSenderId",
        appId: "project appId",
        measurementId: "project measurementId"
    };


    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore()
    await firebase.auth().signInAnonymously().catch(error => console.log(error.message));


    getWeather = firebase.functions().httpsCallable('getWeather');

    // CHECK IF BROWSER SUPPORTS GEOLOCATION
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(setPosition, showError);
    } else {
        notificationElement.style.display = "block";
        notificationElement.innerHTML = "<p>Browser doesn't Support Geolocation</p>";
    }
}
// SET USER'S POSITION
async function setPosition(position) {
    let latitude = position.coords.latitude;
    let longitude = position.coords.longitude;
    window.latitude = latitude;
    window.longitude = longitude
    let res = await getWeather({ latitude, longitude })
    getWeather2(res.data);
}

// SHOW ERROR WHEN THERE IS AN ISSUE WITH GEOLOCATION SERVICE
function showError(error) {
    notificationElement.style.display = "block";
    notificationElement.innerHTML = `<p> ${error.message} </p>`;
}

// GET WEATHER FROM API PROVIDER
function setdatetime(data){
    let formattedTime = '00:00:00';
    if (data){
        let date = new Date(data * 1000);
        let hours = date.getHours();
        let minutes = "0" + date.getMinutes();
        let seconds = "0" + date.getSeconds();
        formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
    }
    return formattedTime;
}

async function getWeather2(data) {
    data = JSON.parse(data)
    weather.temperature.value = Math.floor(data.main.temp - KELVIN);
    weather.description = data.weather[0].description;
    weather.iconId = data.weather[0].icon;
    weather.city = data.name;
    weather.country = data.sys.country;
    if (window.user.uid) { db.doc(`weathers/${window.user.uid}`).set({ ...weather, latitude, longitude, createdAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true }) }


    firebase.firestore().collection('weathers').orderBy('createdAt', 'desc').limit(10).onSnapshot(snapshot => {
        let html = ""
        snapshot.forEach(rec => {
            let daterec = setdatetime(rec.data().createdAt)
            html += `<li class="list-group-item">  <p> ${rec.data().country} - ${rec.data().city} </p> <p> ${rec.data().temperature.value} °<span> C </span></p><p>
            ${distanceBetween(rec.data().latitude, rec.data().longitude, window.latitude, window.longitude, "K").toFixed(1)} km</p> <p> ${daterec} </p></li>`
        })
        uElement.innerHTML = html
    });


    displayWeather();
}

// DISPLAY WEATHER TO UI
function displayWeather() {
    iconElement.innerHTML = `<img src="icons/${weather.iconId}.png"/>`;
    tempElement.innerHTML = `${weather.temperature.value}°<span>C</span>`;
    descElement.innerHTML = weather.description;
    locationElement.innerHTML = `${weather.city}, ${weather.country}`;
}

// C to F conversion
function celsiusToFahrenheit(temperature) {
    return (temperature * 9 / 5) + 32;
}

// WHEN THE USER CLICKS ON THE TEMPERATURE ELEMENET
tempElement.addEventListener("click", function () {
    if (weather.temperature.value === undefined) return;
    if (weather.temperature.unit == "celsius") {
        let fahrenheit = celsiusToFahrenheit(weather.temperature.value);
        fahrenheit = Math.floor(fahrenheit);
        tempElement.innerHTML = `${fahrenheit}°<span>F</span>`;
        weather.temperature.unit = "fahrenheit";
    } else {
        tempElement.innerHTML = `${weather.temperature.value}°<span>C</span>`;
        weather.temperature.unit = "celsius"
    }
});

function distanceBetween(lat1, lon1, lat2, lon2, unit) {
    var rlat1 = Math.PI * lat1 / 180
    var rlat2 = Math.PI * lat2 / 180
    var rlon1 = Math.PI * lon1 / 180
    var rlon2 = Math.PI * lon2 / 180
    var theta = lon1 - lon2
    var rtheta = Math.PI * theta / 180
    var dist = Math.sin(rlat1) * Math.sin(rlat2) + Math.cos(rlat1) * Math.cos(rlat2) * Math.cos(rtheta);
    dist = Math.acos(dist)
    dist = dist * 180 / Math.PI
    dist = dist * 60 * 1.1515
    if (unit == "K") {
        dist = dist * 1.609344
    }
    if (unit == "N") {
        dist = dist * 0.8684
    }
    return dist
}

main();

firebase.auth().onAuthStateChanged((user) => {
    window.user = user;
});

firebase.firestore().doc('timers/timer1').onSnapshot(snapshot => {
    let date = new Date(snapshot.data().time * 1000);
    let hours = date.getHours();
    let minutes = "0" + date.getMinutes();
    let seconds = "0" + date.getSeconds();
    let formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
    document.querySelector('#time').textContent = formattedTime
});
