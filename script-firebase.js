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
    if (currentUser) {
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
                actualiserAffichagePanier();
            }
        }).catch((error) => {
            console.log("Erreur lors du chargement du panier:", error);
        });
    }
}

// --- GESTION PANNEAU LATÉRAL ---
function toggleCart(productName) {
    const cart = document.getElementById('side-cart');
    const overlay = document.getElementById('overlay');
    
    if (!cart) return; // Sécurité si l'élément n'existe pas sur la page

    if (productName) {
        const displayName = document.getElementById('product-display-name');
        if (displayName) displayName.innerText = productName;
    }

    cart.classList.toggle('active');
    if (overlay) {
        overlay.style.display = cart.classList.contains('active') ? 'block' : 'none';
    }
}

// --- NOUVELLE FONCTION : VALIDATION / OUVERTURE PANIER ---
// Cette fonction répare l'erreur "validerCommande is not defined"
function validerCommande() {
    if (panier.length === 0) {
        alert("Votre panier est vide !");
        return;
    }
    
    // On ouvre le panneau latéral pour que l'utilisateur voit son récapitulatif
    const cart = document.getElementById('side-cart');
    if (cart) {
        toggleCart(panier[panier.length - 1].nom);
    } else {
        // Si pas de panneau latéral sur cette page, on finalise directement
        finaliserCommande('direct');
    }
}

// --- GESTION PANIER (AJOUT / RETRAIT) ---

function actualiserAffichagePanier() {
    const cartCount = document.getElementById("cart-count");
    const cartBtn = document.getElementById("cart-btn");
    const displayTitle = document.getElementById('product-display-name');

    if (cartCount) cartCount.innerText = panier.length;
    
    if (panier.length > 0) {
        if (cartBtn) cartBtn.style.display = "block";
        if (displayTitle) displayTitle.innerText = panier[panier.length - 1].nom;
    } else {
        if (cartBtn) cartBtn.style.display = "none";
        if (displayTitle) displayTitle.innerText = "Aucun produit sélectionné";
    }
}

function ajouterAuPanier(nom, prix) {
    if (!currentUser) {
        alert("⚠️ Connecte-toi avec ton pseudo Discord en haut de page !");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    panier.push({ nom, prix });
    actualiserAffichagePanier();
    
    db.collection("intentions").add({ 
        article: nom, 
        prix: prix,
        pseudo: currentUser, 
        date: firebase.firestore.FieldValue.serverTimestamp()
    });

    sauvegarderPanierCloud();
    toggleCart(nom);
}

function retirerDuPanier() {
    if (panier.length > 0) {
        panier.pop(); 
        actualiserAffichagePanier();
        sauvegarderPanierCloud();
        
        if (panier.length === 0) {
            toggleCart(); 
        }
    }
}

// --- FINALISATION ---
function finaliserCommande(type) {
    if (panier.length === 0) {
        alert("Votre panier est vide !");
        return;
    }

    // Récupération sécurisée des inputs (évite les erreurs si absents)
    const qtyInput = document.getElementById('qty-input');
    const promoInput = document.getElementById('promo-input');
    
    const qty = qtyInput ? qtyInput.value : 1;
    const promo = promoInput ? promoInput.value : "";
    
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
        alert("Commande enregistrée ! Redirection vers le Discord...");
        window.location.href = "https://discord.gg/S4y5s82nWw"; 
    }).catch((error) => {
        console.error("Erreur lors de la commande:", error);
        alert("Une erreur est survenue lors de l'envoi.");
    });
}

// Lancement auto
window.addEventListener('DOMContentLoaded', () => {
    afficherProfil();
    chargerPanierCloud();
    actualiserAffichagePanier();
});
