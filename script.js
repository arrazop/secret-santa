// État de l'application
let participants = [];
let duos = [];
let progressiveMode = false;
let revealedDuos = new Set();

// Éléments DOM
const participantInput = document.getElementById('participantInput');
const addBtn = document.getElementById('addBtn');
const participantsList = document.getElementById('participantsList');
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const resultsSection = document.getElementById('resultsSection');
const resultsList = document.getElementById('resultsList');
const regenerateBtn = document.getElementById('regenerateBtn');
const progressiveModeToggle = document.getElementById('progressiveMode');
const revealAllBtn = document.getElementById('revealAllBtn');

// Charger les participants depuis le localStorage
function loadParticipants() {
    const saved = localStorage.getItem('secretSantaParticipants');
    if (saved) {
        participants = JSON.parse(saved);
        renderParticipants();
        updateGenerateButton();
    }
}

// Sauvegarder les participants dans le localStorage
function saveParticipants() {
    localStorage.setItem('secretSantaParticipants', JSON.stringify(participants));
}

// Ajouter un participant
function addParticipant() {
    const name = participantInput.value.trim();
    
    if (!name) {
        alert('Veuillez entrer un nom');
        return;
    }
    
    if (participants.includes(name)) {
        alert('Ce participant existe déjà');
        participantInput.value = '';
        return;
    }
    
    participants.push(name);
    participantInput.value = '';
    saveParticipants();
    renderParticipants();
    updateGenerateButton();
    
    // Masquer les résultats si on ajoute un nouveau participant
    if (resultsSection.style.display !== 'none') {
        resultsSection.style.display = 'none';
    }
}

// Supprimer un participant
function removeParticipant(name) {
    participants = participants.filter(p => p !== name);
    saveParticipants();
    renderParticipants();
    updateGenerateButton();
    
    // Masquer les résultats si on supprime un participant
    if (resultsSection.style.display !== 'none') {
        resultsSection.style.display = 'none';
    }
}

// Afficher les participants
function renderParticipants() {
    if (participants.length === 0) {
        participantsList.innerHTML = '<p class="empty-message">Aucun participant ajouté</p>';
        return;
    }
    
    participantsList.innerHTML = participants.map(name => `
        <div class="participant-tag">
            <span>${escapeHtml(name)}</span>
            <button class="remove-btn" onclick="removeParticipant('${escapeHtml(name)}')" title="Supprimer">×</button>
        </div>
    `).join('');
}

// Mettre à jour l'état du bouton de génération
function updateGenerateButton() {
    generateBtn.disabled = participants.length < 2;
}

// Générer les duos aléatoires
function generateDuos() {
    if (participants.length < 2) {
        alert('Il faut au moins 2 participants pour créer des duos');
        return;
    }
    
    // Réinitialiser les révélations
    revealedDuos.clear();
    
    // Créer une copie mélangée des participants
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    
    // Créer les duos en évitant les auto-assignations
    duos = [];
    let attempts = 0;
    const maxAttempts = 100;
    
    while (duos.length < participants.length && attempts < maxAttempts) {
        const tempShuffled = [...participants].sort(() => Math.random() - 0.5);
        const tempDuos = [];
        let valid = true;
        
        for (let i = 0; i < participants.length; i++) {
            const giver = participants[i];
            const receiver = tempShuffled[i];
            
            // Vérifier qu'on ne s'offre pas un cadeau à soi-même
            if (giver === receiver) {
                valid = false;
                break;
            }
            
            tempDuos.push({ giver, receiver });
        }
        
        if (valid) {
            duos = tempDuos;
            break;
        }
        
        attempts++;
    }
    
    // Si on n'a pas réussi après plusieurs tentatives, utiliser une approche différente
    if (duos.length < participants.length) {
        // Approche alternative : créer des paires circulaires
        duos = [];
        for (let i = 0; i < participants.length; i++) {
            const giver = participants[i];
            const receiver = participants[(i + 1) % participants.length];
            duos.push({ giver, receiver });
        }
    }
    
    renderResults();
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Afficher les résultats
function renderResults() {
    const duoId = (duo) => `${duo.giver}-${duo.receiver}`;
    
    resultsList.innerHTML = duos.map((duo, index) => {
        const id = duoId(duo);
        const isRevealed = revealedDuos.has(id);
        const hiddenClass = progressiveMode && !isRevealed ? 'hidden' : '';
        const revealedClass = isRevealed ? 'revealed' : '';
        
        return `
            <div class="duo-card ${hiddenClass} ${revealedClass}" data-duo-id="${escapeHtml(id)}" data-index="${index}">
                <div class="duo-content">
                    <span class="giver">${escapeHtml(duo.giver)}</span>
                    <span class="arrow">→</span>
                    <span class="receiver">${escapeHtml(duo.receiver)}</span>
                </div>
            </div>
        `;
    }).join('');
    
    // Ajouter les event listeners pour la révélation
    if (progressiveMode) {
        document.querySelectorAll('.duo-card.hidden').forEach(card => {
            card.addEventListener('click', revealDuo);
        });
        revealAllBtn.style.display = 'block';
    } else {
        revealAllBtn.style.display = 'none';
    }
}

// Révéler un duo spécifique
function revealDuo(event) {
    const card = event.currentTarget;
    const duoId = card.getAttribute('data-duo-id');
    
    if (revealedDuos.has(duoId)) return;
    
    revealedDuos.add(duoId);
    card.classList.add('revealing');
    card.classList.remove('hidden');
    
    setTimeout(() => {
        card.classList.remove('revealing');
        card.classList.add('revealed');
        card.removeEventListener('click', revealDuo);
        
        // Vérifier si tous les duos sont révélés
        if (revealedDuos.size === duos.length) {
            revealAllBtn.style.display = 'none';
        }
    }, 800);
}

// Révéler tous les duos progressivement
function revealAllDuos() {
    const hiddenCards = document.querySelectorAll('.duo-card.hidden');
    
    if (hiddenCards.length === 0) return;
    
    hiddenCards.forEach((card, index) => {
        setTimeout(() => {
            const duoId = card.getAttribute('data-duo-id');
            revealedDuos.add(duoId);
            card.classList.add('revealing');
            card.classList.remove('hidden');
            
            setTimeout(() => {
                card.classList.remove('revealing');
                card.classList.add('revealed');
            }, 800);
        }, index * 300); // Délai de 300ms entre chaque révélation
    });
    
    setTimeout(() => {
        revealAllBtn.style.display = 'none';
    }, hiddenCards.length * 300 + 800);
}

// Toggle du mode progressif
function toggleProgressiveMode() {
    progressiveMode = progressiveModeToggle.checked;
    revealedDuos.clear();
    
    if (duos.length > 0) {
        renderResults();
    }
}

// Effacer tout
function clearAll() {
    if (confirm('Êtes-vous sûr de vouloir tout effacer ?')) {
        participants = [];
        duos = [];
        localStorage.removeItem('secretSantaParticipants');
        renderParticipants();
        resultsSection.style.display = 'none';
        updateGenerateButton();
    }
}

// Échapper le HTML pour éviter les injections XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Événements
addBtn.addEventListener('click', addParticipant);

participantInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addParticipant();
    }
});

generateBtn.addEventListener('click', generateDuos);
regenerateBtn.addEventListener('click', generateDuos);
clearBtn.addEventListener('click', clearAll);
progressiveModeToggle.addEventListener('change', toggleProgressiveMode);
revealAllBtn.addEventListener('click', revealAllDuos);

// Initialisation
loadParticipants();

