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

// Variables globales
let currentUser = localStorage.getItem("discordUser") || null;
let panier = [];

// --- LOG DE VISITE ---
db.collection("visites").add({
    page: window.location.pathname,
    pseudo: currentUser || "Anonyme",
    date: new Date()
});

// --- GESTION DU PROFIL DISCORD ---
function connexionDiscord() {
    const input = document.getElementById("discord-input").value;
    if (input.trim() !== "") {
        currentUser = input;
        localStorage.setItem("discordUser", currentUser);
        afficherProfil();
        chargerPanierCloud(); // Récupère le panier sauvegardé s'il existe
    } else {
        alert("Veuillez entrer un pseudo valide.");
    }
}

function afficherProfil() {
    const loginBar = document.getElementById("login-bar");
    const welcome = document.getElementById("user-welcome");
    
    if (currentUser && welcome) {
        // On cache l'input et le bouton, on affiche le pseudo
        document.getElementById("discord-input").style.display = "none";
        loginBar.querySelector('button').style.display = "none";
        
        welcome.innerText = "Connecté : " + currentUser;
        welcome.style.display = "inline";
    }
}

// --- SYNCHRONISATION CLOUD ---
function sauvegarderPanierCloud() {
    if (currentUser) {
        db.collection("paniers_actifs").doc(currentUser).set({
            pseudo: currentUser,
            articles: panier,
            derniere_maj: new Date()
        });
    }
}

function chargerPanierCloud() {
    if (currentUser) {
        db.collection("paniers_actifs").doc(currentUser).get().then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                panier = data.articles || [];
                // Mise à jour de l'affichage
                document.getElementById("cart-count").innerText = panier.length;
                if(panier.length > 0) {
                    document.getElementById("cart-btn").style.display = "block";
                }
            }
        });
    }
}

// --- GESTION PANIER ---
function ajouterAuPanier(nom, prix) {
    if (!currentUser) {
        alert("⚠️ Connecte-toi avec ton pseudo Discord en haut de page pour ajouter des articles !");
        return;
    }

    panier.push({ nom, prix });
    document.getElementById("cart-count").innerText = panier.length;
    document.getElementById("cart-btn").style.display = "block";
    
    // Log d'intention
    db.collection("intentions").add({ 
        article: nom, 
        pseudo: currentUser, 
        date: new Date() 
    });

    // Sauvegarde automatique du profil
    sauvegarderPanierCloud();
}

function validerCommande() {
    if (panier.length === 0) return;

    let recap = panier.map(i => i.nom).join(", ");
    
    db.collection("commandes_finales").add({
        pseudo: currentUser,
        articles: recap,
        date: new Date()
    }).then(() => {
        // On vide le panier cloud après commande si besoin, ou on le laisse
        alert("Sélection enregistrée, " + currentUser + " ! Direction Discord.");
        window.location.href = "https://discord.gg/ton-lien"; // REMPLACE PAR TON LIEN
    });
}

// Lancement auto au chargement de chaque page
window.onload = () => {
    afficherProfil();
    chargerPanierCloud();
};
