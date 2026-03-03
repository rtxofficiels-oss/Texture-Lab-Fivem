// CONFIGURATION FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyDOLvy2PhthQZuBvaVPfq0TWquBuyP3gs4",
    authDomain: "texture-lab-fivem.firebaseapp.com",
    projectId: "texture-lab-fivem",
    storageBucket: "texture-lab-fivem.firebasestorage.app",
    messagingSenderId: "342541770662",
    appId: "1:342541770662:web:e1c9edd45f217f209d7967"
};

// Initialisation
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Variables globales
let currentUser = localStorage.getItem("discordUser") || null;
let panier = [];

// --- LOG DE VISITE ---
// Ajout d'une condition pour ne pas log les visites vides ou de l'admin
if (!window.location.pathname.includes('admin.html')) {
    db.collection("visites").add({
        page: window.location.pathname,
        pseudo: currentUser || "Anonyme",
        date: firebase.firestore.FieldValue.serverTimestamp() // Utilise l'heure serveur pour plus de précision
    });
}

// --- GESTION DU PROFIL DISCORD ---
function connexionDiscord() {
    const input = document.getElementById("discord-input");
    const pseudo = input.value.trim();
    
    if (pseudo !== "") {
        currentUser = pseudo;
        localStorage.setItem("discordUser", currentUser);
        afficherProfil();
        chargerPanierCloud(); // Récupère le panier sauvegardé s'il existe
    } else {
        alert("⚠️ Veuillez entrer un pseudo valide (ex: User#0000).");
    }
}

function afficherProfil() {
    const inputField = document.getElementById("discord-input");
    const loginBtn = document.querySelector("#login-bar button");
    const welcome = document.getElementById("user-welcome");
    
    if (currentUser && welcome) {
        if (inputField) inputField.style.display = "none";
        if (loginBtn) loginBtn.style.display = "none";
        
        welcome.innerText = "✅ Connecté : " + currentUser;
        welcome.style.display = "inline";
    }
}

// --- SYNCHRONISATION CLOUD ---
function sauvegarderPanierCloud() {
    if (currentUser && panier.length > 0) {
        db.collection("paniers_actifs").doc(currentUser).set({
            pseudo: currentUser,
            articles: panier,
            derniere_maj: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
}

function chargerPanierCloud() {
    if (currentUser) {
        db.collection("paniers_actifs").doc(currentUser).get().then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                panier = data.articles || [];
                
                // Mise à jour de l'affichage du badge panier
                const cartCount = document.getElementById("cart-count");
                const cartBtn = document.getElementById("cart-btn");
                
                if (cartCount) cartCount.innerText = panier.length;
                if (cartBtn && panier.length > 0) {
                    cartBtn.style.display = "block";
                }
            }
        }).catch((error) => {
            console.log("Erreur lors du chargement du panier:", error);
        });
    }
}

// --- GESTION PANIER ---
function ajouterAuPanier(nom, prix) {
    if (!currentUser) {
        alert("⚠️ Connecte-toi avec ton pseudo Discord en haut de page pour ajouter des articles !");
        // On scrolle vers le haut pour montrer où se connecter
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    panier.push({ nom, prix });
    
    // Mise à jour interface
    const cartCount = document.getElementById("cart-count");
    const cartBtn = document.getElementById("cart-btn");
    
    if (cartCount) cartCount.innerText = panier.length;
    if (cartBtn) cartBtn.style.display = "block";
    
    // Log d'intention immédiat (pour voir ce que les gens regardent même s'ils ne valident pas)
    db.collection("intentions").add({ 
        article: nom, 
        prix: prix,
        pseudo: currentUser, 
        date: firebase.firestore.FieldValue.serverTimestamp()
    });

    sauvegarderPanierCloud();
}

function validerCommande() {
    if (panier.length === 0) return;

    let recap = panier.map(i => i.nom).join(", ");
    let total = panier.reduce((sum, item) => sum + item.prix, 0);
    
    db.collection("commandes_finales").add({
        pseudo: currentUser,
        articles: recap,
        montant_total: total,
        date: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert("🚀 Sélection enregistrée, " + currentUser + " ! Direction Discord pour ton ticket.");
        // REMPLACE BIEN PAR TON LIEN DISCORD CI-DESSOUS
        window.location.href = "https://discord.gg/S4y5s82nWw"; 
    });
}

// Lancement auto au chargement
window.addEventListener('DOMContentLoaded', () => {
    afficherProfil();
    chargerPanierCloud();
});
