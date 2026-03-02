// CONFIGURATION FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyDOLvy2PhthQZuBvaVPfq0TWquBuyP3gs4",
    authDomain: "texture-lab-fivem.firebaseapp.com",
    projectId: "texture-lab-fivem",
    storageBucket: "texture-lab-fivem.firebasestorage.app",
    messagingSenderId: "342541770662",
    appId: "1:342541770662:web:e1c9edd45f217f209d7967"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// LOG DE VISITE
db.collection("visites").add({
    page: window.location.pathname,
    date: new Date()
});

// GESTION PANIER
let panier = [];
function ajouterAuPanier(nom, prix) {
    panier.push({ nom, prix });
    document.getElementById("cart-count").innerText = panier.length;
    document.getElementById("cart-btn").style.display = "block";
    db.collection("intentions").add({ article: nom, date: new Date() });
}

function validerCommande() {
    let recap = panier.map(i => i.nom).join(", ");
    db.collection("commandes_finales").add({
        articles: recap,
        date: new Date()
    }).then(() => {
        alert("Enregistré ! Direction Discord.");
        window.location.href = "https://discord.gg/ton-lien";
    });
}
