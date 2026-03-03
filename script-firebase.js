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
if (!window.location.pathname.includes('admin.html')) {
    db.collection("visites").add({
        page: window.location.pathname,
        pseudo: currentUser || "Anonyme",
        date: firebase.firestore.FieldValue.serverTimestamp()
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
        chargerPanierCloud();
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

// --- GESTION PANNEAU LATÉRAL (AJOUTÉ) ---
function toggleCart(productName) {
    const cart = document.getElementById('side-cart');
    const overlay = document.getElementById('overlay');
    const displayTitle = document.getElementById('product-display-name');

    if (productName && displayTitle) {
        displayTitle.innerText = productName;
    }

    cart.classList.toggle('active');
    overlay.style.display = cart.classList.contains('active') ? 'block' : 'none';
}

// --- GESTION PANIER ---
function ajouterAuPanier(nom, prix) {
    if (!currentUser) {
        alert("⚠️ Connecte-toi avec ton pseudo Discord en haut de page pour ajouter des articles !");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    panier.push({ nom, prix });
    
    const cartCount = document.getElementById("cart-count");
    const cartBtn = document.getElementById("cart-btn");
    
    if (cartCount) cartCount.innerText = panier.length;
    if (cartBtn) cartBtn.style.display = "block";
    
    db.collection("intentions").add({ 
        article: nom, 
        prix: prix,
        pseudo: currentUser, 
        date: firebase.firestore.FieldValue.serverTimestamp()
    });

    sauvegarderPanierCloud();
    
    // Ouvre le panneau latéral (AJOUTÉ)
    toggleCart(nom);
}

// --- FINALISATION (MODIFIÉ POUR LE PANNEAU) ---
function finaliserCommande(type) {
    if (panier.length === 0) return;

    const qty = document.getElementById('qty-input').value;
    const promo = document.getElementById('promo-input').value;
    let recap = panier.map(i => i.nom).join(", ");
    let total = panier.reduce((sum, item) => sum + item.prix, 0);
    
    db.collection("commandes_finales").add({
        pseudo: currentUser,
        articles: recap,
        montant_total: total,
        quantite: qty,
        code_promo: promo,
        type_clic: type,
        date: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        // REMPLACE PAR TON LIEN DISCORD
        window.location.href = "https://discord.gg/S4y5s82nWw"; 
    });
}

// Lancement auto au chargement
window.addEventListener('DOMContentLoaded', () => {
    afficherProfil();
    chargerPanierCloud();
});
