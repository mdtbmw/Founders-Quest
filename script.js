// Founder's Quest™ - script.js
// Version: 3.0.0 (TekerBot AI Chat & Branding Update)
console.log("script.js: File loaded. Initializing Founder's Quest™ v3.0.0...");

// --- Game State & Configuration ---
let gameState = createDefaultGameState();
let toneJsStarted = false; // Flag to ensure Tone.js starts on user interaction
let gameLoadedFromStorageFirstTime = false; // Flag to manage initial scroll behavior
let isGeneratingIdea = false; // Flag to prevent multiple AI calls for raw idea
let isTekerBotThinking = false; // Flag for TekerBot's general guidance AI calls
let isTekerBotChatting = false; // Flag for TekerBot's chat responses

// Sound Synthesizers
let uiClickSynth, uiConfirmSynth, uiErrorSynth, uiPhaseCompleteSynth, achievementSynth, dragDropSynth, modalSynth, hoverSynth;

// Store the user's API key (as provided by the user)
const GEMINI_API_KEY = "AIzaSyCu2kh683OO9BylOoTSpxBki_uzI4HjKKw";
const TEKERBOT_CHAT_COST = 5; // Cost in TekCoins per chat message to TekerBot

/**
 * Initializes the Tone.js audio context and synthesizers.
 */
function initializeAudio() {
    if (toneJsStarted || typeof Tone === 'undefined') return;
    try {
        Tone.start(); 

        uiClickSynth = new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.05, release: 0.1 }, volume: -20 }).toDestination();
        hoverSynth = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0.01, release: 0.08 }, volume: -28 }).toDestination();
        uiConfirmSynth = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.2 }, volume: -15 }).toDestination();
        uiErrorSynth = new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.2 }, volume: -18 }).toDestination();
        uiPhaseCompleteSynth = new Tone.Synth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.05, decay: 0.5, sustain: 0.3, release: 0.5 }, volume: -12 }).toDestination();
        achievementSynth = new Tone.Synth({ oscillator: { type: 'triangle8' }, envelope: { attack: 0.1, decay: 0.8, sustain: 0.2, release: 1 }, volume: -10 }).toDestination();
        dragDropSynth = new Tone.MembraneSynth({ pitchDecay: 0.02, octaves: 5, oscillator: { type: "sine" }, envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.1, attackCurve: "exponential"}, volume: -15 }).toDestination();
        modalSynth = new Tone.Synth({ oscillator: { type: 'pwm', modulationFrequency: 0.2 }, envelope: { attack: 0.02, decay: 0.3, sustain: 0.1, release: 0.3 }, volume: -18 }).toDestination();

        toneJsStarted = true;
        console.log("Tone.js audio context started and synths initialized.");
    } catch (error) {
        console.warn("Tone.js initialization failed:", error);
        gameState.settings.enableAnimations = false; 
    }
}

// --- Game Data ---
const ideaCategories = ["Disruptive AI Tech", "Sustainable Agri-Solutions", "Experiential Metaverse Retail", "Niche B2B SaaS", "Global Impact NGO", "DeFi FinTech Platform", "Personalized Adaptive EduTech", "Holistic Digital Wellness", "Circular Economy Innovations", "Quantum Computing Applications", "BioTech Breakthroughs"];
const sampleRawIdeas = [
    { text: "An AI co-pilot for complex scientific research and discovery.", category: "Disruptive AI Tech" },
    { text: "A decentralized autonomous organization (DAO) for funding and managing regenerative agriculture projects.", category: "Sustainable Agri-Solutions" },
    { text: "A hyper-realistic VR shopping mall with integrated social and entertainment features.", category: "Experiential Metaverse Retail" },
    { text: "A predictive analytics SaaS for optimizing renewable energy grid management.", category: "Niche B2B SaaS" },
    { text: "A global skill-sharing and mentorship network for underprivileged youth, powered by blockchain credentials.", category: "Global Impact NGO" },
    { text: "An on-demand drone delivery service for artisanal coffee beans in urban centers.", category: "Niche B2B SaaS" },
    { text: "A gamified mobile app that rewards users with crypto for completing micro-learning modules on financial literacy.", category: "DeFi FinTech Platform" }
];
const characterData = {
    charAlice: { id: "charAlice", name: "Alice Chen", skills: ["Leadership", "Strategy", "Finance"], tooltip: "Alice: Visionary Leader, Master Strategist, Financial Acumen. Ideal CEO." },
    charBob: { id: "charBob", name: "Bob 'Cypher' Kumar", skills: ["Tech", "Innovation", "Development", "Cybersecurity"], tooltip: "Bob: Tech Virtuoso, Innovation Driver, Agile Coder, Security Expert. Perfect CTO." },
    charCarol: { id: "charCarol", name: "Carol Maxwell", skills: ["Marketing", "Sales", "Communication", "Branding"], tooltip: "Carol: Marketing Maven, Sales Dynamo, Gifted Communicator, Brand Builder. Excellent CMO." },
    charDave: { id: "charDave", name: "Dave Miller", skills: ["Operations", "Logistics", "HR", "ProjectManagement"], tooltip: "Dave: Operations Guru, Logistics Pro, HR & Project Management. Versatile COO/Head of Ops." },
    charEve: { id: "charEve", name: "Eve Solaris", skills: ["Design", "UX", "Branding", "CreativeDirection"], tooltip: "Eve: Creative Visionary, UX/UI Specialist, Branding Expert. Ideal Chief Design Officer." }
};

const consultancyServices = { // Daniel Innocent's Services
    leanCanvasBoost: { 
        id: "leanCanvasBoost", name: "Lean Canvas Strategy Session", cost: 150, 
        description: "Daniel refines your Lean Canvas for maximum clarity. (+10-25 Clarity & auto-completes Lean Canvas)", 
        activityKey: 'leanCanvas',
        effect: () => {
            gameState.scores.clarity = Math.min(100, gameState.scores.clarity + (Math.floor(Math.random() * 16) + 10));
            const sections = ['problem', 'solution', 'uvp', 'advantage', 'channels', 'customer', 'metrics', 'cost', 'revenue'];
            sections.forEach(sectionKey => {
                gameState.ideate.leanCanvasData[sectionKey] = [{ id: `daniel_${sectionKey}`, text: `Daniel's Insight for ${sectionKey.replace(/([A-Z])/g, ' $1').trim()}` }];
                const sectionDiv = domElements.leanCanvasDropArea?.querySelector(`.lean-canvas-section[data-section="${sectionKey}"] .drop-target`);
                if (sectionDiv) {
                    sectionDiv.innerHTML = `<div class="dropped-orb" data-original-id="daniel_${sectionKey}">Daniel's Insight for ${sectionKey.replace(/([A-Z])/g, ' $1').trim()}</div>`;
                }
            });
            domElements.leanCanvasDraggablesContainer?.querySelectorAll('.draggable.insight-orb').forEach(orb => {
                orb.classList.add('disabled-draggable'); orb.draggable = false;
            });
            gameState.ideate.leanCanvasCompleted = true;
            gameState.ideate.leanCanvasConfirmed = true;
            updateActivityStatus('leanCanvasActivity', true);
            showToast("Daniel Innocent has expertly mapped your Lean Canvas!", "consult");
        } 
    },
    mvvBrandingTuneUp: { 
        id: "mvvBrandingTuneUp", name: "Mission & Brand Resonance Workshop", cost: 200, 
        description: "Daniel crafts a compelling MVV that resonates. (+10-20 Clarity, +5-10 Structure & auto-completes MVV)", 
        activityKey: 'mvv',
        effect: () => {
            gameState.scores.clarity = Math.min(100, gameState.scores.clarity + (Math.floor(Math.random() * 11) + 10));
            gameState.scores.structure = Math.min(100, gameState.scores.structure + (Math.floor(Math.random() * 6) + 5));
            
            gameState.ideate.missionStatement = "Daniel Innocent's Expert Mission: To boldly innovate where no venture has innovated before!";
            gameState.ideate.visionStatement = "Daniel Innocent's Grand Vision: A future dominated by seamless and profitable synergy!";
            const danielCoreValues = ["Innovation", "Integrity", "Excellence"];
            gameState.ideate.coreValues = danielCoreValues;

            if (domElements.missionInput) domElements.missionInput.value = gameState.ideate.missionStatement;
            if (domElements.visionInput) domElements.visionInput.value = gameState.ideate.visionStatement;
            if (domElements.coreValuesSelector) {
                domElements.coreValuesSelector.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
                danielCoreValues.forEach(valId => {
                    const cb = domElements.coreValuesSelector.querySelector(`#val${valId}`);
                    if (cb) cb.checked = true;
                });
            }
            gameState.ideate.mvvCompleted = true;
            gameState.ideate.mvvConfirmed = true;
            updateActivityStatus('missionVisionValuesActivity', true);
            showToast("Daniel Innocent has expertly crafted your Mission, Vision & Values!", "consult");
        } 
    },
    brandIdentityKickstart: { 
        id: "brandIdentityKickstart", name: "Brand Identity Kickstart", cost: 300, 
        description: "Daniel develops a foundational brand identity. (+15-25 Structure & auto-completes Branding)", 
        activityKey: 'branding',
        effect: () => {
            gameState.scores.structure = Math.min(100, gameState.scores.structure + (Math.floor(Math.random() * 11) + 15));
            
            gameState.build.selectedLogoStyle = "Modern";
            gameState.build.tagline = "Innovate. Integrate. Inspire. By Daniel Innocent.";
            gameState.build.primaryColor = "#FFC107"; // HeyTek Gold
            gameState.build.secondaryColor = "#001023"; // HeyTek Dark Blue
            gameState.build.fontStyle = "sans-serif-modern";
            gameState.build.selectedFeatures = ["AI Powered", "Mobile First", "Analytics Suite"];

            if(domElements.selectedLogoDisplay) domElements.selectedLogoDisplay.textContent = gameState.build.selectedLogoStyle;
            if(domElements.taglineInput) domElements.taglineInput.value = gameState.build.tagline;
            if(domElements.primaryColorPicker) domElements.primaryColorPicker.value = gameState.build.primaryColor;
            if(domElements.primaryColorValue) domElements.primaryColorValue.textContent = gameState.build.primaryColor.toUpperCase();
            if(domElements.secondaryColorPicker) domElements.secondaryColorPicker.value = gameState.build.secondaryColor;
            if(domElements.secondaryColorValue) domElements.secondaryColorValue.textContent = gameState.build.secondaryColor.toUpperCase();
            if(domElements.fontStyleSelect) domElements.fontStyleSelect.value = gameState.build.fontStyle;
            if(domElements.logoDesignArea) {
                domElements.logoDesignArea.querySelectorAll('.logo-choice-btn').forEach(btn => {
                    btn.classList.remove('active','bg-yellow-400','text-blue-900'); btn.classList.add('button-tertiary');
                    if (btn.dataset.logoStyle === gameState.build.selectedLogoStyle) {btn.classList.add('active','bg-yellow-400','text-blue-900'); btn.classList.remove('button-tertiary');}
                });
            }
            if(domElements.productFeaturesArea) {
                domElements.productFeaturesArea.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
                gameState.build.selectedFeatures.forEach(val => {const cb = domElements.productFeaturesArea.querySelector(`input[value="${val}"]`); if (cb) cb.checked = true;});
            }
            gameState.build.brandingCompleted = true;
            gameState.build.brandingConfirmed = true;
            updateActivityStatus('brandingActivity', true);
            showToast("Daniel Innocent has kickstarted your Brand Identity!", "consult");
        } 
    },
    teamSynergyConsult: { 
        id: "teamSynergyConsult", name: "Core Team Synergy Analysis", cost: 250, 
        description: "Daniel optimizes your team structure. (+10-20 Structure, +5-10 Execution & auto-assigns team)", 
        activityKey: 'teamAssignment', 
        effect: () => {
            gameState.scores.structure = Math.min(100, gameState.scores.structure + (Math.floor(Math.random() * 11) + 10));
            gameState.scores.execution = Math.min(100, gameState.scores.execution + (Math.floor(Math.random() * 6) + 5));

            gameState.build.assignedTeam = { CEO: 'charAlice', CTO: 'charBob', CMO: 'charCarol', COO: 'charDave' };
            
            if(domElements.teamRolesDropArea && domElements.characterPool) {
                Object.keys(gameState.build.assignedTeam).forEach(role => {
                    const charId = gameState.build.assignedTeam[role];
                    const roleSlotEl = domElements.teamRolesDropArea.querySelector(`.role-slot[data-role="${role.toUpperCase()}"]`);
                    if (roleSlotEl) updateRoleSlotUI(roleSlotEl, charId ? characterData[charId] : null);
                });
                document.querySelectorAll('#characterPool .character-card').forEach(charCardEl => {
                    const cardId = charCardEl.dataset.characterId;
                    let isAssigned = Object.values(gameState.build.assignedTeam).includes(cardId);
                    charCardEl.classList.toggle('assigned-elsewhere',isAssigned); 
                    charCardEl.classList.toggle('opacity-30',isAssigned); 
                    charCardEl.classList.toggle('pointer-events-none',isAssigned);
                    charCardEl.draggable=!isAssigned; 
                    charCardEl.style.opacity=isAssigned?'0.4':'1';
                });
            }
            gameState.build.teamAssignmentCompleted = true; 
            gameState.build.teamAssignmentConfirmed = true; 
            updateActivityStatus('teamAssignmentActivity', true);
            showToast("Daniel Innocent has assembled a synergistic Core Team for you!", "consult");
        } 
    },
};


// --- DOM Element References ---
let domElements = {}; 
function initializeDomElements() {
    const ids = [
        'preloader', 'gameUIWrapper', 'narrativeOnboardingModal', 'danielConsultancyModal', 
        'unlockablesModal', 'settingsModal', 'achievementsModal', 'confirmationModal',
        'tekerBotChatModal', 'tekerBotChatMessages', 'tekerBotChatInput', 'sendTekerBotChatMessageButton', 'chatWithTekerBotButton', // TekerBot Chat UI
        'clarityScoreDisplay', 'structureScoreDisplay', 'executionPowerDisplay', 
        'marketReceptionDisplay', 'currencyDisplay', 'headerCompanyName',
        'aiMentorBo', 'boMessage', 'closeMentorButton', // aiMentorBo is TekerBot's panel
        'ideatePhase', 'buildPhase', 'operatePhase', 'growPhase', 'endgameSection',
        'startIdeatePhaseButton', 'completeIdeatePhaseButton', 'completeBuildPhaseButton', 
        'completeOperatePhaseButton', 'completeGrowPhaseButton',
        'closeConsultancyModalButton', 'confirmationModalTitle', 'confirmationModalMessage', 
        'confirmationModalConfirmButton', 'confirmationModalCancelButton',
        'companyNameInput', 'ideaSourceSelect', 'customIdeaInputContainer', 'customIdeaText', 
        'rawIdeaCardDisplay', 'rawIdeaText', 'ideaCategory',
        'toastNotificationArea', 'consultancyOptionsContainer',
        'ideatePhaseClarityScore', 'buildPhaseStructureScore', 'operatePhaseOpsScore', 'growPhaseMarketScore',
        'ideateClarityProgressBar', 'buildStructureProgressBar', 'operateExecutionProgressBar', 'growMarketProgressBar',
        'leanCanvasActivity', 'leanCanvasDropArea', 'leanCanvasDraggablesContainer', 'submitLeanCanvasButton', 'consultDanielLeanCanvasButton',
        'missionVisionValuesActivity', 'missionInput', 'visionInput', 'coreValuesSelector', 'submitMVVButton', 'consultDanielMVVButton',
        'validationGameActivity', 'completeValidationGameButton',
        'brandingActivity', 'logoDesignArea', 'selectedLogoDisplay', 'taglineInput', 
        'primaryColorPicker', 'secondaryColorPicker', 'primaryColorValue', 'secondaryColorValue', 
        'fontStyleSelect', 'productFeaturesArea', 'submitBrandingButton', 'consultDanielBrandingButton',
        'teamAssignmentActivity', 'teamRolesDropArea', 'characterPool', 'submitTeamButton', 'consultDanielTeamButton',
        'workflowActivity', 'completeWorkflowButton', 'offerPageActivity', 'completeOfferPageButton',
        'dailyOpsActivity', 'simulateOperateButton', 'marketExpansionActivity', 'simulateGrowButton',
        'soundVolume', 'musicVolume', 'tutorialToggle', 'animationsToggle', 
        'resetGameProgressButton', 'saveSettingsButton',
        'saveGameButton', 'settingsButton', 'achievementsButton', 'achievementsList',
        'unlockableMessage', 'unlockableContent', 'currentYear',
        'ideatePhaseProgress', 'buildPhaseProgress', 'operatePhaseProgress', 'growPhaseProgress'
    ];
    ids.forEach(id => { 
        const element = document.getElementById(id);
        if (element) {
            domElements[id] = element;
        } else {
            console.warn(`DOM element with ID '${id}' not found.`);
        }
    });
    domElements.allPhaseSections = document.querySelectorAll('.game-phase');
}

// --- Utility Functions ---
function showElement(element) { 
    if (element) { 
        element.classList.remove('hidden', 'opacity-0'); 
        element.classList.add('opacity-100');
    }
}
function hideElement(element) { 
    if (element) { 
        element.classList.add('opacity-0');
        setTimeout(() => { 
            if (element.classList.contains('opacity-0')) element.classList.add('hidden'); 
        }, 300);
    }
}

async function updateBoMessage(messageOrContext, autoShow = true, isAiPowered = false) {
    // Renamed #aiMentorBo to #tekerBotPanel in HTML if that's intended, or use domElements.aiMentorBo
    const tekerBotPanel = domElements.aiMentorBo; // Assuming aiMentorBo is the ID for TekerBot's panel
    const tekerBotMessageEl = domElements.boMessage; // Assuming boMessage is the ID for TekerBot's message display

    if (!tekerBotMessageEl || !tekerBotPanel) return;

    if (isAiPowered && gameState.settings.showTutorials) {
        if (isTekerBotThinking) return; 
        isTekerBotThinking = true;
        tekerBotMessageEl.innerHTML = "<span class='italic text-cyan-400'>TekerBot is formulating a strategy...</span>";
        if (autoShow) {
            if (tekerBotPanel.classList.contains('hidden')) showElement(tekerBotPanel);
            tekerBotPanel.classList.remove('opacity-0', 'translate-y-10');
            tekerBotPanel.classList.add('opacity-100', 'translate-y-0');
        }

        try {
            const guidancePrompt = `You are TekerBot, an AI mentor in the startup simulation game 'Founder's Quest™' by HeyTek Limited. The game creator is Daniel Innocent (@MDTBMW).
Provide concise, encouraging, and actionable advice (1-2 short sentences, max 40 words) to a player.
Reflect Daniel Innocent's philosophy: growth, resilience, proactive action, stepping out of comfort zones.
Current game situation: The player is ${messageOrContext}.
Their company is named '${gameState.companyName}' and their core idea is '${gameState.rawIdea.text}'.
Keep it positive, game-focused, and in character as a helpful, slightly futuristic AI mentor from HeyTek.`;
            
            const aiResponse = await getGeminiResponse(guidancePrompt);
            if (aiResponse) {
                tekerBotMessageEl.innerHTML = aiResponse;
            } else {
                tekerBotMessageEl.innerHTML = "Hmm, my circuits are a bit fuzzy. Let's stick to the plan, Founder!"; 
            }
        } catch (error) {
            console.error("Error getting AI mentor guidance:", error);
            tekerBotMessageEl.innerHTML = "My apologies, Founder. A slight glitch in my neural net. Focus on the current objectives!"; 
        } finally {
            isTekerBotThinking = false;
        }
    } else {
        tekerBotMessageEl.innerHTML = messageOrContext;
        if (autoShow && gameState.settings.showTutorials) {
            if (tekerBotPanel.classList.contains('hidden')) showElement(tekerBotPanel);
            tekerBotPanel.classList.remove('opacity-0', 'translate-y-10');
            tekerBotPanel.classList.add('opacity-100', 'translate-y-0');
        } else if (!gameState.settings.showTutorials) {
            hideBoMessage(); 
        }
    }
}


function hideBoMessage() { // Renamed to hideTekerBotMessage if aiMentorBo is TekerBot's panel
    const tekerBotPanel = domElements.aiMentorBo;
    if (tekerBotPanel) {
        tekerBotPanel.classList.remove('opacity-100', 'translate-y-0');
        tekerBotPanel.classList.add('opacity-0', 'translate-y-10');
        setTimeout(() => { 
            if(tekerBotPanel.classList.contains('opacity-0')) hideElement(tekerBotPanel);
        }, 400); 
    }
}

function playSound(soundId, volumeMultiplier = 1) {
    if (!toneJsStarted || !soundId || !gameState.settings.enableAnimations || !gameState.settings.soundVolume) return;
    if (!uiClickSynth && Tone.context.state === 'running') { 
        initializeAudio(); 
        if (!uiClickSynth) return; 
    }
    
    const effectiveVolume = gameState.settings.soundVolume * volumeMultiplier;
    if (effectiveVolume <= 0.01 && soundId !== 'ui_slider') return; 

    try {
        const soundMap = {
            'ui_click': { synth: uiClickSynth, note: 'C5', duration: '16n', volMod: 0.6 },
            'ui_click_subtle': { synth: uiClickSynth, note: 'C5', duration: '32n', volMod: 0.4 },
            'ui_checkbox': { synth: uiClickSynth, note: 'E5', duration: '16n', volMod: 0.5 },
            'ui_select': { synth: uiClickSynth, note: 'D5', duration: '16n', volMod: 0.5 },
            'ui_slider': { synth: uiClickSynth, note: 'A4', duration: '64n', volMod: 0.3 }, 
            'ui_color_pick': { synth: uiClickSynth, note: 'F5', duration: '16n', volMod: 0.6 },
            'ui_hover_light': { synth: hoverSynth, note: 'A5', duration: '32n', volMod: 0.5 },
            'ui_confirm': { synth: uiConfirmSynth, note: 'E4', duration: '8n', volMod: 1 },
            'ui_save': { synth: uiConfirmSynth, note: 'G4', duration: '8n', volMod: 1 },
            'ui_confirm_major': { synth: uiConfirmSynth, note: 'C5', duration: '4n', volMod: 1.2 },
            'ui_cancel': { synth: uiClickSynth, note: 'A4', duration: '8n', volMod: 0.7 },
            'ui_close': { synth: uiClickSynth, note: 'G4', duration: '8n', volMod: 0.6 },
            'ui_close_subtle': { synth: uiClickSynth, note: 'F4', duration: '16n', volMod: 0.5 },
            'ui_warning': { synth: uiErrorSynth, note: 'F#3', duration: '8n', volMod: 1 },
            'drop_fail': { synth: uiErrorSynth, note: 'D3', duration: '8n', volMod: 0.9 },
            'ui_warning_confirm': { synth: uiErrorSynth, note: 'A#3', duration: '4n', volMod: 1.1 },
            'ui_phase_complete': [ { synth: uiPhaseCompleteSynth, note: 'C4', duration: '0.4n', volMod: 1.1, delay: 0 }, { synth: uiPhaseCompleteSynth, note: 'G4', duration: '0.4n', volMod: 1.1, delay: 0.15 }, { synth: uiPhaseCompleteSynth, note: 'C5', duration: '0.4n', volMod: 1.1, delay: 0.3 } ],
            'achievement_unlocked': [ { synth: achievementSynth, note: 'C5', duration: '0.5n', volMod: 1.3, delay: 0 }, { synth: achievementSynth, note: 'E5', duration: '0.5n', volMod: 1.3, delay: 0.15 }, { synth: achievementSynth, note: 'G5', duration: '0.5n', volMod: 1.3, delay: 0.3 }, { synth: achievementSynth, note: 'C6', duration: '0.5n', volMod: 1.3, delay: 0.45 } ],
            'modal_achievement': [ { synth: achievementSynth, note: 'C5', duration: '0.5n', volMod: 1.3, delay: 0 }, { synth: achievementSynth, note: 'E5', duration: '0.5n', volMod: 1.3, delay: 0.15 }, { synth: achievementSynth, note: 'G5', duration: '0.5n', volMod: 1.3, delay: 0.3 }, { synth: achievementSynth, note: 'C6', duration: '0.5n', volMod: 1.3, delay: 0.45 } ],
            'drag_start': { synth: dragDropSynth, note: 'C2', duration: '8n', volMod: 0.8 },
            'drag_end': { synth: dragDropSynth, note: 'G2', duration: '8n', volMod: 1 },
            'drop_success': { synth: dragDropSynth, note: 'E3', duration: '4n', volMod: 1.1 }, 
            'modal_open': { synth: modalSynth, note: 'A3', duration: '8n', volMod: 0.9 },
            'modal_consult': { synth: modalSynth, note: 'C4', duration: '8n', volMod: 0.9 },
            'modal_onboarding': { synth: modalSynth, note: 'G3', duration: '4n', volMod: 0.9 },
            'modal_settings': { synth: modalSynth, note: 'F3', duration: '8n', volMod: 0.8 },
            'modal_achievements_log': { synth: modalSynth, note: 'E3', duration: '8n', volMod: 0.8 },
            'modal_warning': { synth: modalSynth, note: 'D3', duration: '4n', volMod: 1, pitchMod: -0.2 },
            'toast_appear': { synth: uiClickSynth, note: 'D6', duration: '16n', volMod: 0.7 } 
        };
        const soundAction = soundMap[soundId];
        if (soundAction) {
            if (Array.isArray(soundAction)) {
                soundAction.forEach(action => { 
                    if (action.synth) action.synth.triggerAttackRelease(action.note, action.duration, Tone.now() + (action.delay || 0), effectiveVolume * (action.volMod || 1)); 
                });
            } else {
                if (soundAction.synth) {
                    let note = soundAction.note;
                    if (soundAction.pitchMod) { 
                        const freq = Tone.Frequency(soundAction.note).toFrequency(); 
                        note = Tone.Frequency(freq * Math.pow(2, soundAction.pitchMod / 12)).toNote(); 
                    }
                    soundAction.synth.triggerAttackRelease(note, soundAction.duration, Tone.now(), effectiveVolume * (soundAction.volMod || 1));
                }
            }
        } else { console.warn(`Sound ID "${soundId}" not mapped.`); }
    } catch (e) { console.warn(`Tone.js playSound error for ${soundId}:`, e); }
}

function showToast(message, type = 'info', duration = 4500) {
    if (!domElements.toastNotificationArea) return;
    const toast = document.createElement('div');
    toast.className = `p-4 rounded-lg shadow-xl text-sm z-[10001] transition-all duration-300 ease-out transform opacity-0 translate-x-full mb-3 max-w-md border-l-4 pointer-events-auto`;
    let c = {bg:'bg-gray-800',txt:'text-gray-100',bdr:'border-blue-500',ico:'ℹ️ '}; 
    if(type==='success'){c={bg:'bg-green-700',txt:'text-white',bdr:'border-green-500',ico:'✓ '}}
    else if(type==='warning'){c={bg:'bg-yellow-600',txt:'text-black',bdr:'border-yellow-400',ico:'⚠️ '}}
    else if(type==='danger'||type==='error'){c={bg:'bg-red-700',txt:'text-white',bdr:'border-red-500',ico:'✕ '}}
    else if(type==='consult'){c={bg:'bg-purple-700',txt:'text-white',bdr:'border-purple-500',ico:'💡 '}}
    toast.classList.add(c.bg,'bg-opacity-95','backdrop-blur-sm',c.txt,c.bdr);
    toast.innerHTML = `<span class="font-bold mr-1">${c.ico}</span>${message}`;
    domElements.toastNotificationArea.appendChild(toast);
    setTimeout(() => { toast.classList.remove('opacity-0','translate-x-full'); toast.classList.add('opacity-100','translate-x-0'); playSound('toast_appear',0.7);}, 10);
    setTimeout(() => { toast.classList.remove('opacity-100','translate-x-0'); toast.classList.add('opacity-0','translate-x-full'); setTimeout(() => { if (toast.parentNode === domElements.toastNotificationArea) domElements.toastNotificationArea.removeChild(toast);}, 300);}, duration);
}

function showModal(modalElement) {
    if (modalElement) {
        modalElement.classList.remove('hidden'); 
        void modalElement.offsetWidth; 
        modalElement.classList.add('opacity-100');
        const mc = modalElement.querySelector('.modal-content');
        if (mc) { 
            mc.classList.remove('opacity-0','translate-y-5','scale-95'); 
            mc.classList.add('opacity-100','translate-y-0','scale-100');
        }
        playSound(modalElement.dataset.soundOpen || 'modal_open');
        const firstFocusable = mc?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) firstFocusable.focus();
    }
}
function hideModal(modalElement) {
    if (modalElement) {
        const mc = modalElement.querySelector('.modal-content');
        if (mc) { 
            mc.classList.remove('opacity-100','translate-y-0','scale-100'); 
            mc.classList.add('opacity-0','translate-y-5','scale-95');
        }
        modalElement.classList.remove('opacity-100'); 
        modalElement.classList.add('opacity-0');
        setTimeout(() => modalElement.classList.add('hidden'), 300); 
        playSound(modalElement.dataset.soundClose || 'ui_close_subtle');
    }
}

let currentOnConfirmCallback = null, currentOnCancelCallback = null;
function showConfirmationModal(title, message, onConfirm, onCancel, confirmBtnTxt = "Confirm", confirmBtnCls = "button-danger") {
    if (!domElements.confirmationModal || !domElements.confirmationModalTitle || !domElements.confirmationModalMessage || !domElements.confirmationModalConfirmButton || !domElements.confirmationModalCancelButton) {
        if (window.confirm(`${title}\n${message}`)) { if(onConfirm) onConfirm(); } else { if(onCancel) onCancel(); } 
        return;
    }
    domElements.confirmationModalTitle.textContent = title;
    domElements.confirmationModalMessage.innerHTML = message; 
    domElements.confirmationModalConfirmButton.textContent = confirmBtnTxt;
    domElements.confirmationModalConfirmButton.className = `button ${confirmBtnCls}`; 
    currentOnConfirmCallback = onConfirm; 
    currentOnCancelCallback = onCancel;
    showModal(domElements.confirmationModal);
}
function handleConfirmationConfirm() {
    playSound('ui_warning_confirm'); 
    if (currentOnConfirmCallback) currentOnConfirmCallback();
    hideModal(domElements.confirmationModal); 
    currentOnConfirmCallback = null; currentOnCancelCallback = null;
}
function handleConfirmationCancel() {
    playSound('ui_cancel');
    if (currentOnCancelCallback) currentOnCancelCallback();
    hideModal(domElements.confirmationModal); 
    currentOnConfirmCallback = null; currentOnCancelCallback = null;
}


// --- Game State Management ---
function saveGameState() { 
    try { 
        localStorage.setItem('foundersQuestGameState_v3.0.0', JSON.stringify(gameState)); 
        console.log("Game state saved (v3.0.0)."); 
    } catch (e) { 
        console.error("Error saving game state:", e); 
        showToast("Could not save progress. Storage might be full or unavailable.", "danger"); 
    } 
}
function loadGameState() {
    try {
        const savedStateString = localStorage.getItem('foundersQuestGameState_v3.0.0'); 
        if (savedStateString) {
            const parsedState = JSON.parse(savedStateString);
            if (!parsedState || typeof parsedState.scores !== 'object' || typeof parsedState.currency !== 'number') {
                console.warn("Invalid saved state structure found. Resetting to default.");
                localStorage.removeItem('foundersQuestGameState_v3.0.0'); 
                return false;
            }
            const defaultState = createDefaultGameState();
            const mergeRecursive = (target, source) => {
                for (const key in target) { 
                    if (source.hasOwnProperty(key)) { 
                        if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key]) &&
                            target[key] !== null && typeof target[key] === 'object' && !Array.isArray(target[key])) {
                            mergeRecursive(target[key], source[key]);
                        } else if (source[key] !== undefined) { 
                            target[key] = source[key];
                        }
                    }
                }
                for (const key in source) { 
                    if (source.hasOwnProperty(key) && !target.hasOwnProperty(key) && source[key] !== undefined) {
                        target[key] = source[key];
                    }
                }
            };
            let newState = JSON.parse(JSON.stringify(defaultState)); 
            mergeRecursive(newState, parsedState); 

            if (newState.ideate && defaultState.ideate.leanCanvasData) {
                for (const leanKey in defaultState.ideate.leanCanvasData) {
                    if (!Array.isArray(newState.ideate.leanCanvasData[leanKey])) {
                        newState.ideate.leanCanvasData[leanKey] = []; 
                    }
                }
            }
            if (newState.build && defaultState.build.assignedTeam) {
                 newState.build.assignedTeam = { ...defaultState.build.assignedTeam, ...(newState.build.assignedTeam || {}) };
            }
            // Ensure boChatHistory is an array
            if (!Array.isArray(newState.boChatHistory)) {
                newState.boChatHistory = [];
            }


            gameState = newState;
            console.log("Game state loaded and merged (v3.0.0):", JSON.parse(JSON.stringify(gameState))); 
            return true;
        }
    } catch (e) { 
        console.error("Error loading game state:", e); 
        localStorage.removeItem('foundersQuestGameState_v3.0.0'); 
    }
    return false;
}
function createDefaultGameState() {
    return {
        currentPhase: null, 
        companyName: "My TekVille Venture",
        rawIdea: { text: 'A revolutionary new concept!', category: 'Custom Venture', source: 'generate' },
        scores: { clarity: 0, structure: 0, execution: 0, market: 0 }, 
        currency: 1000,
        ideate: {
            leanCanvasCompleted: false, leanCanvasConfirmed: false, 
            mvvCompleted: false, mvvConfirmed: false,
            validationGameCompleted: false, validationGameConfirmed: false,
            missionStatement: "", visionStatement: "", coreValues: [],
            leanCanvasData: { problem: [], solution: [], uvp: [], advantage: [], channels: [], customer: [], metrics: [], cost: [], revenue: [] }
        },
        build: { 
            brandingCompleted: false, brandingConfirmed: false,
            selectedLogoStyle: null, tagline: "", primaryColor: "#FFC107", secondaryColor: "#001023", fontStyle: "sans-serif-modern", selectedFeatures: [],
            teamAssignmentCompleted: false, teamAssignmentConfirmed: false, 
            assignedTeam: { CEO: null, CTO: null, CMO: null, COO: null },
            workflowCompleted: false, workflowConfirmed: false, 
            offerPageCompleted: false, offerPageConfirmed: false, 
        },
        operate: { dailyOpsCompleted: false, dailyOpsConfirmed: false },
        grow: { marketExpansionCompleted: false, marketExpansionConfirmed: false },
        settings: { soundVolume: 0.5, musicVolume: 0.3, showTutorials: true, enableAnimations: true },
        achievements: [], 
        danielConsultations: [], 
        gameInitialized: false,
        boChatHistory: [], // Initialize chat history
    };
}

function updateDashboard() {
    if (domElements.headerCompanyName) domElements.headerCompanyName.textContent = gameState.companyName || "Your Company";
    if (domElements.clarityScoreDisplay) domElements.clarityScoreDisplay.textContent = gameState.scores.clarity;
    if (domElements.structureScoreDisplay) domElements.structureScoreDisplay.textContent = gameState.scores.structure;
    if (domElements.executionPowerDisplay) domElements.executionPowerDisplay.textContent = gameState.scores.execution;
    if (domElements.marketReceptionDisplay) domElements.marketReceptionDisplay.textContent = gameState.scores.market;
    if (domElements.currencyDisplay) domElements.currencyDisplay.textContent = gameState.currency;
    
    ['ideateClarity', 'buildStructure', 'operateExecution', 'growMarket'].forEach(key => {
        const scoreType = key.includes('Clarity') ? 'clarity' : key.includes('Structure') ? 'structure' : key.includes('Execution') ? 'execution' : 'market';
        const progressBar = domElements[key + 'ProgressBar'];
        const scoreDisplayKey = key.replace('Clarity','PhaseClarityScore').replace('Structure','PhaseStructureScore').replace('Execution','PhaseOpsScore').replace('Market','PhaseMarketScore');
        const scoreDisplay = domElements[scoreDisplayKey];
        if (progressBar) updateProgressBar(progressBar, gameState.scores[scoreType]);
        if (scoreDisplay) scoreDisplay.textContent = `${gameState.scores[scoreType]}%`;
    });
}
function updateProgressBar(el, val) {
    if (el) { 
        val = Math.max(0, Math.min(100, val)); 
        el.style.width = `${val}%`; 
        el.setAttribute('aria-valuenow', val); 
        let colorClass = 'bg-green-500'; 
        if (val < 30) colorClass = 'bg-red-500'; 
        else if (val < 70) colorClass = 'bg-yellow-500'; 
        el.classList.remove('bg-red-500', 'bg-yellow-500', 'bg-green-500'); 
        el.classList.add(colorClass); 
    }
}

async function setActivePhase(phaseName, forceScroll = false) { 
    console.log(`Setting active phase: ${phaseName}`);
    const currentPhaseId = gameState.currentPhase ? gameState.currentPhase.toLowerCase() + 'Phase' : null;
    const currentPhaseSection = currentPhaseId ? domElements[currentPhaseId] : null;

    if (currentPhaseSection && !currentPhaseSection.classList.contains('hidden') && gameState.settings.enableAnimations) {
        currentPhaseSection.classList.remove('phase-enter-active'); 
        currentPhaseSection.classList.add('phase-exit-active');
        setTimeout(() => { 
            hideElement(currentPhaseSection); 
            currentPhaseSection.classList.remove('phase-exit-active'); 
        }, 450); 
    } else if (currentPhaseSection) { 
        hideElement(currentPhaseSection); 
    }

    gameState.currentPhase = phaseName;
    if (!domElements.allPhaseSections) return;
    domElements.allPhaseSections.forEach(s => { 
        if (s.id !== phaseName.toLowerCase()+'Phase' && !s.classList.contains('hidden')) hideElement(s); 
    });

    let activeSection = domElements[phaseName.toLowerCase() + 'Phase'];
    let mentorContext = ""; 
    let staticMentorMsg = ""; 

    switch (phaseName) {
        case 'IDEATE': 
            mentorContext = "entering the IDEATE phase. They need to focus on their Lean Canvas first.";
            staticMentorMsg = "Welcome to <strong class='text-yellow-300'>IDEATE</strong>! Start with your <strong class='text-cyan-300'>Lean Canvas</strong> to map your strategy.";
            break;
        case 'BUILD': 
            mentorContext = "entering the BUILD phase. Their first task is Brand Identity.";
            staticMentorMsg = "Time to <strong class='text-yellow-300'>BUILD</strong>! Solidify your <strong class='text-cyan-300'>Brand Identity</strong> and assemble your team."; 
            break;
        case 'OPERATE': 
            mentorContext = "entering the OPERATE phase. They need to manage daily tasks now.";
            staticMentorMsg = "Let's <strong class='text-yellow-300'>OPERATE</strong>. Manage <strong class='text-cyan-300'>daily tasks</strong> and optimize workflows."; 
            break;
        case 'GROW': 
            mentorContext = "entering the GROW phase. They should focus on marketing and scaling.";
            staticMentorMsg = "Ready to <strong class='text-yellow-300'>GROW</strong>? Explore <strong class='text-cyan-300'>marketing campaigns</strong> and scale your venture."; 
            break;
        case 'ENDGAME': 
            staticMentorMsg = `Congratulations, Founder! ${gameState.companyName} has <strong class='text-green-400'>LAUNCHED</strong>! View your legacy.`; 
            setupEndgameScreen(); 
            break;
        default: 
            console.warn(`Unknown phase: ${phaseName}. Defaulting to IDEATE.`);
            setActivePhase('IDEATE', true); 
            return;
    }

    if (phaseName !== 'ENDGAME') { 
        updateBoMessage(mentorContext, true, true); 
    } else {
        updateBoMessage(staticMentorMsg, true, false); 
    }


    if (activeSection) {
        const delay = (currentPhaseSection && !currentPhaseSection.classList.contains('hidden') && gameState.settings.enableAnimations) ? 450 : 50; 
        setTimeout(() => {
            showElement(activeSection);
            if (gameState.settings.enableAnimations) { 
                activeSection.classList.remove('opacity-0','phase-exit-active'); 
                setTimeout(() => activeSection.classList.add('opacity-100','phase-enter-active'), 20); 
            } else { 
                activeSection.classList.remove('opacity-0'); 
                activeSection.classList.add('opacity-100'); 
            }
            if (forceScroll || !gameLoadedFromStorageFirstTime) {
                activeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            updateActivityVisibilityForCurrentPhase(); 
            checkPhaseCompletionReadiness(phaseName); 
        }, delay);
    }
    updateDashboard(); 
    saveGameState();
}

function openConsultancyModal(activityContext) {
    if (!domElements.danielConsultancyModal || !domElements.consultancyOptionsContainer) return;
    domElements.consultancyOptionsContainer.innerHTML = ''; 

    Object.values(consultancyServices).forEach(service => {
        const alreadyPurchased = gameState.danielConsultations.includes(service.id);
        const canAfford = gameState.currency >= service.cost;
        const card = document.createElement('div');
        card.className = `p-5 rounded-lg shadow-lg border border-purple-500 bg-gray-800 bg-opacity-70 hover:bg-purple-700 hover:bg-opacity-30 transition-all duration-300 ${alreadyPurchased || !canAfford ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-purple-300'}`;
        card.innerHTML = `
            <h4 class="text-xl font-semibold text-purple-300 mb-2">${service.name}</h4>
            <p class="text-sm text-gray-300 mb-3">${service.description}</p>
            <div class="flex justify-between items-center">
                <span class="text-lg font-bold text-yellow-400">${service.cost} TC</span>
                <button data-service-id="${service.id}" data-service-cost="${service.cost}" class="button button-consult text-sm py-2 px-4 ${alreadyPurchased || !canAfford ? 'opacity-50' : ''}" ${alreadyPurchased || !canAfford ? 'disabled' : ''}>
                    ${alreadyPurchased ? 'Utilized' : (canAfford ? 'Hire Daniel' : 'Insufficient TC')}
                </button>
            </div>`;
        if (!alreadyPurchased && canAfford) {
            const button = card.querySelector('button');
            if (button) button.addEventListener('click', handleHireDaniel);
        }
        domElements.consultancyOptionsContainer.appendChild(card);
    });
    showModal(domElements.danielConsultancyModal);
    updateBoMessage(`Considering expert help for ${activityContext}? Daniel Innocent offers specialized services to boost your progress.`, true, false); 
}

function handleHireDaniel(event) {
    const button = event.currentTarget;
    const serviceId = button.dataset.serviceId;
    const serviceCost = parseInt(button.dataset.serviceCost);
    const service = consultancyServices[serviceId];

    if (service && gameState.currency >= serviceCost && !gameState.danielConsultations.includes(serviceId)) {
        playSound('ui_confirm_major', 1.2);
        gameState.currency -= serviceCost;
        
        try { 
            service.effect(); 
            if (service.activityKey) {
                console.log(`Daniel's help for ${service.activityKey} applied.`);
                updateActivityVisibilityForCurrentPhase(); 
                checkPhaseCompletionReadiness(gameState.currentPhase); 
            }
        } 
        catch (e) { console.error("Error during service.effect():", e); showToast("Error applying consultation effect.", "danger"); }

        try { addAchievement("Strategic Thinker", `Consulted Daniel for ${service.name}.`); } 
        catch (e) { console.error("Error during addAchievement:", e); }

        gameState.danielConsultations.push(serviceId);
        updateDashboard();
        saveGameState();
        
        button.textContent = 'Utilized';
        button.disabled = true;
        button.classList.add('opacity-50');
        button.closest('.p-5')?.classList.add('opacity-60', 'cursor-not-allowed');

        domElements.consultancyOptionsContainer.querySelectorAll('button[data-service-id]').forEach(btn => {
            if (btn !== button) { 
                const sId = btn.dataset.serviceId;
                const sCost = parseInt(btn.dataset.serviceCost);
                const purchased = gameState.danielConsultations.includes(sId);
                const afford = gameState.currency >= sCost;
                if (!purchased) {
                    if (!afford) { btn.textContent = 'Insufficient TC'; btn.disabled = true; btn.classList.add('opacity-50'); btn.closest('.p-5')?.classList.add('opacity-60', 'cursor-not-allowed');}
                    else { btn.textContent = 'Hire Daniel'; btn.disabled = false; btn.classList.remove('opacity-50'); btn.closest('.p-5')?.classList.remove('opacity-60', 'cursor-not-allowed');}
                }
            }
        });
    } else if (gameState.danielConsultations.includes(serviceId)) {
        showToast("You've already utilized this service.", "warning"); playSound('ui_warning');
    } else {
        showToast("Not enough TekCoins for this service!", "danger"); playSound('ui_error');
    }
}

async function getGeminiResponse(promptText, expectJson = false, jsonSchema = null) {
    const payload = {
        contents: [{ role: "user", parts: [{ text: promptText }] }],
    };
    if (expectJson) {
        payload.generationConfig = {
            responseMimeType: "application/json",
            responseSchema: jsonSchema || { type: "STRING" } 
        };
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Gemini API request failed:", response.status, errorBody);
            throw new Error(`API request failed with status ${response.status}. Details: ${errorBody}`);
        }

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            
            const responseText = result.candidates[0].content.parts[0].text;
            if (expectJson) {
                try {
                    return JSON.parse(responseText);
                } catch (e) {
                    console.error("Failed to parse JSON response from Gemini:", e, "\nRaw response:", responseText);
                    throw new Error("AI returned invalid JSON.");
                }
            }
            return responseText; 
        } else {
            console.warn("Unexpected Gemini response structure:", result);
            throw new Error("Unexpected response structure from AI.");
        }
    } catch (error) {
        console.error("Error in getGeminiResponse:", error);
        return null; 
    }
}


async function fetchIdeaFromGeminiAI() { 
    if (isGeneratingIdea) {
        console.log("AI idea generation already in progress.");
        return null; 
    }
    isGeneratingIdea = true;
    if (domElements.rawIdeaText) domElements.rawIdeaText.innerHTML = "<span class='italic text-cyan-400'>TekerBot is brainstorming with the AI Collective...</span>";
    if (domElements.ideaCategory) domElements.ideaCategory.textContent = "Thinking...";
    if (domElements.startIdeatePhaseButton) domElements.startIdeatePhaseButton.disabled = true;

    const categoryListString = ideaCategories.map(cat => `- ${cat}`).join("\n");
    const prompt = `You are TekerBot, an AI assistant for a startup simulation game called 'Founder's Quest™' by HeyTek Limited.
Game creator: Daniel Innocent (@MDTBMW).
Generate one concise and innovative business idea.
The idea should be suitable for a player to develop in the game. It should be around 15-25 words.
Also, provide a category for this idea. The category MUST be one of the following exact strings:
${categoryListString}

Respond ONLY with a valid JSON object.`;

    const ideaSchema = {
        type: "OBJECT",
        properties: {
            "text": { "type": "STRING", "description": "The business idea text, around 15-25 words." },
            "category": { "type": "STRING", "description": "The category of the business idea from the provided list." }
        },
        required: ["text", "category"]
    };

    try {
        const generatedIdea = await getGeminiResponse(prompt, true, ideaSchema);
        if (generatedIdea && generatedIdea.text && generatedIdea.category && ideaCategories.includes(generatedIdea.category)) {
            return { text: generatedIdea.text, category: generatedIdea.category };
        } else {
            console.warn("Gemini response format or category invalid for idea generation:", generatedIdea);
            throw new Error("Invalid idea format or category from AI for idea generation.");
        }
    } catch (error) {
        console.error("Error fetching idea from Gemini:", error);
        return null; 
    } finally {
        isGeneratingIdea = false;
        if (domElements.startIdeatePhaseButton) domElements.startIdeatePhaseButton.disabled = false;
    }
}


async function generateRawIdea(useAI = true) {
    if (useAI && gameState.rawIdea.source === 'generate') {
        const aiIdea = await fetchIdeaFromGeminiAI(); 
        if (aiIdea) {
            gameState.rawIdea = { text: aiIdea.text, category: aiIdea.category, source: 'generate-ai' };
        } else {
            showToast("TekerBot's idea generation failed. Using a sample idea.", "warning");
            const idx = Math.floor(Math.random() * sampleRawIdeas.length);
            const idea = sampleRawIdeas[idx];
            gameState.rawIdea = { text: idea.text, category: idea.category || "Miscellaneous", source: 'generate-sample' };
        }
    } else { 
        const idx = Math.floor(Math.random() * sampleRawIdeas.length);
        const idea = sampleRawIdeas[idx];
        gameState.rawIdea = { text: idea.text, category: idea.category || "Miscellaneous", source: 'generate-sample' };
    }
    
    if (domElements.rawIdeaText) domElements.rawIdeaText.textContent = gameState.rawIdea.text;
    if (domElements.ideaCategory) domElements.ideaCategory.textContent = gameState.rawIdea.category;
    console.log("Generated raw idea:", gameState.rawIdea);
}

function handleIdeaSourceChange() {
    if (!domElements.ideaSourceSelect || !domElements.customIdeaInputContainer || !domElements.rawIdeaCardDisplay) return;
    const previousSource = gameState.rawIdea.source;
    gameState.rawIdea.source = domElements.ideaSourceSelect.value;

    if (gameState.rawIdea.source === 'custom') { 
        showElement(domElements.customIdeaInputContainer); 
        hideElement(domElements.rawIdeaCardDisplay); 
        domElements.customIdeaText?.focus();
    } else { 
        hideElement(domElements.customIdeaInputContainer); 
        showElement(domElements.rawIdeaCardDisplay); 
        if (previousSource === 'custom' || !gameState.rawIdea.text || gameState.rawIdea.text === "[Idea will appear here]" || domElements.rawIdeaText.textContent.includes("brainstorming")) {
            generateRawIdea(true); 
        } else { 
            if (domElements.rawIdeaText) domElements.rawIdeaText.textContent = gameState.rawIdea.text;
            if (domElements.ideaCategory) domElements.ideaCategory.textContent = gameState.rawIdea.category;
        }
    }
}
function finalizeOnboardingChoices() {
    const name = domElements.companyNameInput?.value.trim();
    gameState.companyName = name || "My TekVille Venture"; 
    if (domElements.companyNameInput && !name) domElements.companyNameInput.value = gameState.companyName; 
    if (domElements.headerCompanyName) domElements.headerCompanyName.textContent = gameState.companyName;

    if (gameState.rawIdea.source === 'custom') {
        const custom = domElements.customIdeaText?.value.trim();
        gameState.rawIdea.text = custom || "A user-defined revolutionary concept!"; 
        gameState.rawIdea.category = "Custom Venture";
    } else if (!gameState.rawIdea.text || gameState.rawIdea.text === "[Idea will appear here]" || domElements.rawIdeaText.textContent.includes("brainstorming")) {
        generateRawIdea(gameState.rawIdea.source === 'generate'); 
    }
    addAchievement("Venture Christened", `Founded ${gameState.companyName} with the idea: "${gameState.rawIdea.text.substring(0,30)}..."`);
    updateDashboard();
}

function updateActivityStatus(activityId, isCompleted) {
    const card = domElements[activityId]; 
    if (!card) { console.warn(`Activity card for ID '${activityId}' not found.`); return; }
    
    const icon = card.querySelector('.activity-status-icon');
    if (icon) icon.dataset.completed = isCompleted.toString();
    
    const actionBtn = card.querySelector('.button-action, button[id^="submit"], button[id^="complete"], button[id^="simulate"]');
    if (actionBtn) { 
        actionBtn.disabled = isCompleted; 
        actionBtn.classList.toggle('opacity-50', isCompleted); 
        actionBtn.classList.toggle('cursor-not-allowed', isCompleted); 
    }
}

function checkAndPotentiallyUnlockNextActivity(phase, currentActivityKey, nextActivityKey, nextActivityElement) {
    const phaseKeyLower = phase.toLowerCase();
    const phaseState = gameState[phaseKeyLower];
    if (!phaseState) { console.error(`Phase state for ${phase} not found.`); return; }

    const activityDomIdKey = `${currentActivityKey}Activity`;
    const currentActivityCard = domElements[activityDomIdKey];

    if (!currentActivityCard) { console.warn(`Activity card for ${currentActivityKey} (DOM ID: ${activityDomIdKey}) not found.`); return; }
    
    let existingProceedButton = currentActivityCard.querySelector('.button-proceed-next');
    if (existingProceedButton) existingProceedButton.remove();
    
    console.log(`[${currentActivityKey}] Check for Proceed Button: Completed=${phaseState[currentActivityKey+'Completed']}, Confirmed=${phaseState[currentActivityKey+'Confirmed']}`);

    if (phaseState[`${currentActivityKey}Completed`] && !phaseState[`${currentActivityKey}Confirmed`]) {
        console.log(`Activity ${currentActivityKey} is completed but not confirmed. Creating proceed button.`);
        let proceedButton = document.createElement('button');
        const nextActivityName = nextActivityKey ? nextActivityKey.replace(/([A-Z])/g, ' $1').trim() : "Next Phase"; 
        proceedButton.textContent = `Confirm & Proceed to: ${nextActivityName}`; 
        proceedButton.className = 'button button-secondary mt-4 button-proceed-next w-full md:w-auto';
        proceedButton.dataset.soundClick = 'ui_confirm';
        
        const anchor = currentActivityCard.querySelector('.consultant-cta') || currentActivityCard.querySelector('.button-action, button[id^="submit"], button[id^="complete"], button[id^="simulate"]');
        if (anchor?.parentNode) {
             anchor.parentNode.insertBefore(proceedButton, anchor.nextSibling);
        } else {
            currentActivityCard.appendChild(proceedButton); 
        }
        
        proceedButton.addEventListener('click', () => {
            playSound('ui_confirm_major'); 
            phaseState[`${currentActivityKey}Confirmed`] = true; 
            console.log(`CONFIRMED by button click: ${currentActivityKey} in phase ${phase}. New status: ${phaseState[currentActivityKey + 'Confirmed']}`);
            
            hideElement(proceedButton); 
            updateActivityVisibilityForCurrentPhase(); 
            checkPhaseCompletionReadiness(phase); 
            saveGameState();
        });
        updateActivityStatus(activityDomIdKey, true); 
    } else {
        console.log(`Activity ${currentActivityKey}: No proceed button needed (either not completed or already confirmed).`);
    }
}

function updateActivityVisibilityForCurrentPhase() {
    if (!gameState.currentPhase) return;
    const phase = gameState.currentPhase;
    const phaseKey = phase.toLowerCase();
    const phaseState = gameState[phaseKey];
    if (!phaseState) {console.error(`State for phase ${phaseKey} not found.`); return;}
    console.log(`Updating activity visibility for phase: ${phaseKey}`);

    const manageStep = (currentKey, nextKey, currentActivityEl, nextActivityEl) => {
        const activityDomIdKey = `${currentKey}Activity`; 
        const currentElToUse = currentActivityEl || domElements[activityDomIdKey];

        if (!currentElToUse) { console.warn(`Element for ${currentKey} (DOM ID: ${activityDomIdKey}) not found.`); return; }
        console.log(`Managing step: ${currentKey}. Completed: ${phaseState[currentKey+'Completed']}, Confirmed: ${phaseState[currentKey+'Confirmed']}`);

        if (phaseState[`${currentKey}Completed`]) {
            updateActivityStatus(activityDomIdKey, true); 
            if (phaseState[`${currentKey}Confirmed`]) {
                console.log(`${currentKey} is CONFIRMED. Hiding its proceed button, showing ${nextKey || 'nothing next'}.`);
                const proceedBtn = currentElToUse.querySelector('.button-proceed-next');
                if (proceedBtn) hideElement(proceedBtn); 
                if (nextActivityEl) showElement(nextActivityEl); 
            } else {
                console.log(`${currentKey} is COMPLETED but NOT CONFIRMED. Checking for proceed button, hiding ${nextKey || 'nothing next'}.`);
                checkAndPotentiallyUnlockNextActivity(phase, currentKey, nextKey, nextActivityEl); 
                if (nextActivityEl) hideElement(nextActivityEl); 
            }
        } else {
            console.log(`${currentKey} is NOT COMPLETED. Hiding its proceed button and ${nextKey || 'nothing next'}.`);
            updateActivityStatus(activityDomIdKey, false); 
            const proceedBtn = currentElToUse.querySelector('.button-proceed-next');
            if (proceedBtn) hideElement(proceedBtn); 
            if (nextActivityEl) hideElement(nextActivityEl); 
        }
    };

    if (phaseKey === 'ideate') {
        if (domElements.leanCanvasActivity) showElement(domElements.leanCanvasActivity);
        manageStep('leanCanvas', 'mvv', domElements.leanCanvasActivity, domElements.missionVisionValuesActivity);
        if (phaseState.leanCanvasConfirmed) { 
            manageStep('mvv', 'validationGame', domElements.missionVisionValuesActivity, domElements.validationGameActivity);
        } else { 
            if(domElements.missionVisionValuesActivity) hideElement(domElements.missionVisionValuesActivity); 
            if(domElements.validationGameActivity) hideElement(domElements.validationGameActivity); 
        }
    } else if (phaseKey === 'build') {
        if (domElements.brandingActivity) showElement(domElements.brandingActivity);
        manageStep('branding', 'teamAssignment', domElements.brandingActivity, domElements.teamAssignmentActivity);
        if (phaseState.brandingConfirmed) {
            manageStep('teamAssignment', 'workflow', domElements.teamAssignmentActivity, domElements.workflowActivity);
            if (phaseState.teamAssignmentConfirmed) { 
                 manageStep('workflow', 'offerPage', domElements.workflowActivity, domElements.offerPageActivity);
            } else { 
                if(domElements.workflowActivity) hideElement(domElements.workflowActivity); 
                if(domElements.offerPageActivity) hideElement(domElements.offerPageActivity); 
            }
        } else { 
            if(domElements.teamAssignmentActivity) hideElement(domElements.teamAssignmentActivity); 
            if(domElements.workflowActivity) hideElement(domElements.workflowActivity); 
            if(domElements.offerPageActivity) hideElement(domElements.offerPageActivity); 
        }
    } else if (phaseKey === 'operate') {
        if (domElements.dailyOpsActivity) showElement(domElements.dailyOpsActivity);
        manageStep('dailyOps', 'GROW', domElements.dailyOpsActivity, null); 
    } else if (phaseKey === 'grow') {
        if (domElements.marketExpansionActivity) showElement(domElements.marketExpansionActivity);
        manageStep('marketExpansion', 'ENDGAME', domElements.marketExpansionActivity, null);
    }
    updatePhaseProgressDisplay(); 
    checkPhaseCompletionReadiness(phase); 
}

function checkPhaseCompletionReadiness(phaseName) {
    const phaseKey = phaseName.toLowerCase();
    const phaseState = gameState[phaseKey];
    const phaseButton = domElements[`complete${phaseName}PhaseButton`]; 
    if (!phaseState || !phaseButton) {
        console.warn(`State or button for phase ${phaseName} not found for completion check.`);
        return;
    }

    let ready = false;
    let debugReason = `[${phaseName}] Phase Completion Button Check: `;
    let activityKeysForPhase = [];

    if (phaseKey === 'ideate') {
        activityKeysForPhase = ['leanCanvas', 'mvv', 'validationGame'];
        ready = activityKeysForPhase.every(key => phaseState[`${key}Confirmed`]) && gameState.scores.clarity >= 30;
        debugReason += activityKeysForPhase.map(k => `${k} Conf: ${phaseState[k+'Confirmed']}`).join(', ') + `, Clarity: ${gameState.scores.clarity} (Need 30). Ready: ${ready}`;
    } else if (phaseKey === 'build') {
        activityKeysForPhase = ['branding', 'teamAssignment', 'workflow', 'offerPage']; 
        ready = activityKeysForPhase.every(key => phaseState[`${key}Confirmed`]) && gameState.scores.structure >= 25;
        debugReason += activityKeysForPhase.map(k => `${k} Conf: ${phaseState[k+'Confirmed']}`).join(', ') + `, Structure: ${gameState.scores.structure} (Need 25). Ready: ${ready}`;
    } else if (phaseKey === 'operate') {
        activityKeysForPhase = ['dailyOps'];
        ready = phaseState.dailyOpsConfirmed && gameState.scores.execution >= 25;
        debugReason += `Ops Conf: ${phaseState.dailyOpsConfirmed}, Execution: ${gameState.scores.execution} (Need 25). Ready: ${ready}`;
    } else if (phaseKey === 'grow') {
        activityKeysForPhase = ['marketExpansion'];
        ready = phaseState.marketExpansionConfirmed && gameState.scores.market >= 25;
        debugReason += `Market Conf: ${phaseState.marketExpansionConfirmed}, Market Score: ${gameState.scores.market} (Need 25). Ready: ${ready}`;
    }
    console.log(debugReason); 

    phaseButton.disabled = !ready;
    phaseButton.classList.toggle('opacity-50', !ready);
    phaseButton.classList.toggle('cursor-not-allowed', !ready);
    if (ready) {
        phaseButton.classList.add('animate-pulse'); 
    } else {
        phaseButton.classList.remove('animate-pulse');
    }
}


function updatePhaseProgressDisplay() {
    const phaseKey = gameState.currentPhase?.toLowerCase();
    if (!phaseKey || !domElements[`${phaseKey}PhaseProgress`]) return;
    
    let completedSteps = 0, totalSteps = 0;
    const phaseState = gameState[phaseKey];
    const progressSpan = domElements[`${phaseKey}PhaseProgress`];
    let activityKeysForPhaseProgress = [];

    if (phaseKey === 'ideate') { activityKeysForPhaseProgress = ['leanCanvas', 'mvv', 'validationGame']; }
    else if (phaseKey === 'build') { activityKeysForPhaseProgress = ['branding', 'teamAssignment', 'workflow', 'offerPage']; }
    else if (phaseKey === 'operate') { activityKeysForPhaseProgress = ['dailyOps'];}
    else if (phaseKey === 'grow') { activityKeysForPhaseProgress = ['marketExpansion'];}
    
    totalSteps = activityKeysForPhaseProgress.length;
    activityKeysForPhaseProgress.forEach(key => {
        if (phaseState[`${key}Confirmed`]) completedSteps++;
    });
    
    if (progressSpan) {
        progressSpan.textContent = totalSteps > 0 ? `(${completedSteps}/${totalSteps} steps confirmed)` : '';
        progressSpan.setAttribute('aria-label', `${completedSteps} of ${totalSteps} steps confirmed for ${gameState.currentPhase} phase.`);
    }
}

// --- IDEATE Phase Specific Logic ---
function handleSubmitLeanCanvas() {
    playSound('ui_confirm'); 
    let filledSections = 0; 
    ['problem','solution','uvp','advantage','channels','customer','metrics','cost','revenue'].forEach(key => {
        if(gameState.ideate.leanCanvasData[key]?.length > 0) filledSections++;
    });
    if (filledSections >= 3) { 
        gameState.ideate.leanCanvasCompleted = true; 
        gameState.scores.clarity = Math.min(100, gameState.scores.clarity + 15 + Math.floor(Math.random() * 11)); 
        showToast("Lean Canvas mapped! Strategic insights gained.", "success"); 
        updateBoMessage("defining their Lean Canvas. They've mapped out the core components.", true, true); 
        addAchievement("Blueprint Drafted", "Mapped the core components of your Lean Canvas."); 
        updateActivityStatus('leanCanvasActivity', true); 
        checkAndPotentiallyUnlockNextActivity('IDEATE','leanCanvas','mvv',domElements.missionVisionValuesActivity); 
    } else { 
        showToast("Please map at least 3 Insight Orbs to your Lean Canvas to form a basic strategy.", "warning", 6000); 
        updateBoMessage("A solid strategy needs at least three core insights. Drag more orbs to your canvas.", true, false); 
    }
    updateDashboard(); 
    saveGameState();
}
function handleSubmitMVV() {
    playSound('ui_confirm'); 
    const mission = domElements.missionInput?.value.trim();
    const vision = domElements.visionInput?.value.trim();
    const selectedValues = domElements.coreValuesSelector ? Array.from(domElements.coreValuesSelector.querySelectorAll('input:checked')).map(cb => cb.id.replace('val','')) : [];
    
    if (mission && vision && selectedValues.length >= 3 && selectedValues.length <= 5){
        gameState.ideate.missionStatement = mission;
        gameState.ideate.visionStatement = vision;
        gameState.ideate.coreValues = selectedValues;
        gameState.ideate.mvvCompleted = true;
        gameState.scores.clarity = Math.min(100, gameState.scores.clarity + 10 + Math.floor(Math.random() * 6));
        showToast("Mission, Vision & Values defined! Your company's North Star is set.","success");
        updateBoMessage("defining their Mission, Vision, and Values. They've articulated the soul of their company.", true, true);
        addAchievement("North Star Defined","Articulated your company's Mission, Vision, and Core Values.");
        updateActivityStatus('missionVisionValuesActivity',true);
        checkAndPotentiallyUnlockNextActivity('IDEATE','mvv','validationGame',domElements.validationGameActivity);
    } else {
        let warningMsg = "Please complete all fields for your MVV. ";
        if(!mission) warningMsg += "Your Mission Statement is missing. ";
        if(!vision) warningMsg += "Your Vision Statement is missing. ";
        if(selectedValues.length < 3 || selectedValues.length > 5) warningMsg += "Select 3 to 5 Core Values.";
        showToast(warningMsg,"warning", 7000);
        updateBoMessage("Ensure your Mission, Vision, and 3-5 Core Values are clearly defined.", true, false);
    }
    updateDashboard();
    saveGameState();
}
function handleCompleteValidationGame() {
    playSound('ui_confirm');
    gameState.ideate.validationGameCompleted = true;
    gameState.ideate.validationGameConfirmed = true; 
    console.log("Validation Game Confirmed status: ", gameState.ideate.validationGameConfirmed); 
    gameState.scores.clarity = Math.min(100, gameState.scores.clarity + 10 + Math.floor(Math.random() * 11));
    gameState.scores.market = Math.min(100, gameState.scores.market + 5 + Math.floor(Math.random() * 6));
    updateActivityStatus('validationGameActivity',true);
    showToast("Market validation (simulated) concluded! Valuable insights gathered.","success");
    updateBoMessage("completing the market validation. They've gathered initial feedback.", true, true);
    addAchievement("Market Pulse Checked","Completed the initial idea validation game.");
    updateActivityVisibilityForCurrentPhase(); 
    updateDashboard();
    saveGameState();
}

// --- BUILD Phase Specific Logic ---
function handleLogoChoice(event){
    const button = event.target.closest('.logo-choice-btn');
    if(!button || !domElements.logoDesignArea) return;
    playSound('ui_hover_light');
    domElements.logoDesignArea.querySelectorAll('.logo-choice-btn').forEach(btn => {
        btn.classList.remove('active','bg-yellow-400','text-blue-900');
        btn.classList.add('button-tertiary');
        btn.setAttribute('aria-checked', 'false');
    });
    button.classList.add('active','bg-yellow-400','text-blue-900');
    button.classList.remove('button-tertiary');
    button.setAttribute('aria-checked', 'true');
    gameState.build.selectedLogoStyle = button.dataset.logoStyle;
    if(domElements.selectedLogoDisplay) domElements.selectedLogoDisplay.textContent = gameState.build.selectedLogoStyle;
}
function handleSubmitBranding() {
    playSound('ui_confirm');
    if(domElements.taglineInput) gameState.build.tagline = domElements.taglineInput.value.trim();
    const selectedFeatures = domElements.productFeaturesArea ? Array.from(domElements.productFeaturesArea.querySelectorAll('input:checked')).map(cb => cb.value) : [];
    gameState.build.selectedFeatures = selectedFeatures;

    if(gameState.build.selectedLogoStyle && gameState.build.tagline && selectedFeatures.length >= 3 && selectedFeatures.length <= 5){
        gameState.build.brandingCompleted = true;
        gameState.scores.structure = Math.min(100, gameState.scores.structure + 15 + Math.floor(Math.random()*11));
        updateActivityStatus('brandingActivity',true);
        showToast("Branding Suite finalized! Your venture's identity is taking shape.","success");
        updateBoMessage("finalizing their Branding Suite. Their visual and verbal identity is set.", true, true); 
        addAchievement("Brand Forged","Defined your company's visual and verbal identity.");
        checkAndPotentiallyUnlockNextActivity('BUILD','branding','teamAssignment',domElements.teamAssignmentActivity);
    } else {
        let errorMsg = "Branding incomplete: ";
        if(!gameState.build.selectedLogoStyle) errorMsg += "Select a Logo Archetype. ";
        if(!gameState.build.tagline) errorMsg += "Enter a memorable Tagline. ";
        if(selectedFeatures.length < 3 || selectedFeatures.length > 5) errorMsg += "Select 3 to 5 Key Product Features.";
        showToast(errorMsg,"warning", 7000);
        updateBoMessage("Complete all branding elements: Logo, Tagline, Colors, Font, and 3-5 Features.", true, false); 
    }
    updateDashboard();
    saveGameState();
}
function handleSubmitTeam() {
    playSound('ui_confirm');
    const { CEO, CTO, CMO } = gameState.build.assignedTeam;
    if(CEO && CTO && CMO){ 
        gameState.build.teamAssignmentCompleted = true; 
        gameState.scores.structure = Math.min(100, gameState.scores.structure + 12 + Math.floor(Math.random()*9));
        gameState.scores.execution = Math.min(100, gameState.scores.execution + 8 + Math.floor(Math.random()*8)); 
        updateActivityStatus('teamAssignmentActivity',true);
        showToast("Core team assembled! Synergy is key.","success");
        updateBoMessage("assembling their core team. Leadership is crucial!", true, true); 
        addAchievement("Dream Team Assembled","Assigned key leadership roles: CEO, CTO, and CMO.");
        checkAndPotentiallyUnlockNextActivity('BUILD','teamAssignment','workflow',domElements.workflowActivity);
    } else {
        showToast("Please fill the mandatory CEO, CTO, and CMO roles for your venture.","warning", 6000);
        updateBoMessage("A venture needs its leaders. Ensure CEO, CTO, and CMO roles are assigned.", true, false); 
    }
    updateDashboard();
    saveGameState();
}
function handleCompleteWorkflow(){
    playSound('ui_confirm');
    gameState.build.workflowCompleted = true; 
    gameState.build.workflowConfirmed = true; 
    gameState.scores.structure = Math.min(100, gameState.scores.structure + 8 + Math.floor(Math.random()*5));
    updateActivityStatus('workflowActivity',true);
    showToast("Core workflow (simulated) defined! Operational efficiency incoming.","success");
    updateBoMessage("defining their core workflow. Smooth operations are key.", true, true); 
    addAchievement("Process Architect","Outlined the core operational workflow.");
    updateActivityVisibilityForCurrentPhase(); 
    updateDashboard();
    saveGameState();
}
function handleCompleteOfferPage(){
    playSound('ui_confirm');
    gameState.build.offerPageCompleted = true; 
    gameState.build.offerPageConfirmed = true; 
    console.log("Offer Page Confirmed status: ", gameState.build.offerPageConfirmed); 
    gameState.scores.structure = Math.min(100, gameState.scores.structure + 7 + Math.floor(Math.random()*6));
    gameState.scores.market += Math.floor(Math.random()*5); 
    updateActivityStatus('offerPageActivity',true);
    showToast("Offer page (simulated) drafted! Ready to attract customers.","success");
    updateBoMessage("drafting their offer page. A compelling offer is vital.", true, true); 
    addAchievement("Digital Storefront","Drafted the initial offer page for your product/service.");
    updateActivityVisibilityForCurrentPhase(); 
    updateDashboard();
    saveGameState();
}

// --- OPERATE & GROW Phase (Simplified for now) ---
function handleSimulateOperate(){
    playSound('ui_confirm');
    gameState.operate.dailyOpsCompleted = true;
    gameState.operate.dailyOpsConfirmed = true; 
    console.log("Daily Ops Confirmed status: ", gameState.operate.dailyOpsConfirmed); 
    gameState.scores.execution = Math.min(100, gameState.scores.execution + 20 + Math.floor(Math.random()*11));
    gameState.currency += Math.floor(Math.random() * 50) - 20; 
    if (gameState.currency < 0) gameState.currency = 0;
    updateActivityStatus('dailyOpsActivity',true);
    showToast("Operations cycle (simulated) complete! Business is running.","success");
    updateBoMessage("managing daily operations. Efficiency is the name of the game now.", true, true); 
    addAchievement("Operational Cadence","Established a rhythm for daily operations.");
    updateActivityVisibilityForCurrentPhase(); 
    updateDashboard();
    saveGameState();
}
function handleSimulateGrow(){
    playSound('ui_confirm');
    gameState.grow.marketExpansionCompleted = true;
    gameState.grow.marketExpansionConfirmed = true; 
    console.log("Market Expansion Confirmed status: ", gameState.grow.marketExpansionConfirmed); 
    gameState.scores.market = Math.min(100, gameState.scores.market + 20 + Math.floor(Math.random()*11));
    gameState.currency += Math.floor(Math.random() * 100) - 30; 
    if (gameState.currency < 0) gameState.currency = 0;
    updateActivityStatus('marketExpansionActivity',true);
    showToast("Growth initiatives (simulated) launched! Expanding market reach.","success");
    updateBoMessage("launching growth initiatives. Time to scale and conquer!", true, true); 
    addAchievement("Market Mover","Successfully launched growth and market expansion efforts.");
    updateActivityVisibilityForCurrentPhase(); 
    updateDashboard();
    saveGameState();
}

// --- Achievements ---
function addAchievement(title, description){
    if(!gameState.achievements.find(a => a.title === title)){
        const achievement = {title, description, unlockedAt: new Date().toISOString(), claimed: false};
        gameState.achievements.push(achievement);
        if(domElements.unlockablesModal && domElements.unlockableMessage){
            domElements.unlockableMessage.innerHTML = `<h3 class="text-2xl font-semibold text-yellow-300 mb-2">${title}</h3><p class="text-gray-300">${description}</p>`;
            showModal(domElements.unlockablesModal);
            playSound('achievement_unlocked');
        } else {
            showToast(`🏆 Achievement Unlocked: ${title}`,'success',6000);
        }
        saveGameState(); 
        updateAchievementsModal(); 
    }
}
function updateAchievementsModal(){
    if(!domElements.achievementsList) return;
    domElements.achievementsList.innerHTML = ''; 
    if(gameState.achievements.length === 0){
        domElements.achievementsList.innerHTML = `<p class="text-gray-400 italic">No achievements unlocked yet. Keep playing to earn them!</p>`;
        return;
    }
    [...gameState.achievements].sort((a,b) => new Date(b.unlockedAt) - new Date(a.unlockedAt)).forEach(ach => {
        const item = document.createElement('div');
        item.className = `achievement-item p-3 border-b border-gray-700 ${ach.claimed ? 'opacity-70' : ''}`; 
        item.innerHTML = `
            <div class="flex items-center">
                <span class="text-2xl mr-3">${ach.claimed ? '✅' : '🏆'}</span>
                <div>
                    <h4 class="text-lg font-semibold ${ach.claimed ? 'text-green-400' : 'text-yellow-300'}">${ach.title}</h4>
                    <p class="text-sm text-gray-400">${ach.description}</p>
                    <p class="text-xs text-gray-500">Unlocked: ${new Date(ach.unlockedAt).toLocaleDateString()}</p>
                </div>
            </div>`;
        domElements.achievementsList.appendChild(item);
    });
}

function setupEndgameScreen(){
    if(!domElements.endgameSection) return;
    const totalScore = gameState.scores.clarity + gameState.scores.structure + gameState.scores.execution + gameState.scores.market;
    const title = totalScore > 250 ? "TekVille Legend!" : totalScore > 150 ? "TekVille Contender!" : "TekVille Pioneer!";

    domElements.endgameSection.innerHTML = `
        <h2 id="endgameTitle" class="phase-title text-green-300">${title} - ${gameState.companyName || "Your Venture"} LAUNCHED!</h2>
        <div class="text-center p-8 bg-gray-800 bg-opacity-70 rounded-lg shadow-xl border-2 border-green-500">
            <div class="text-6xl mb-6 animate-bounce" aria-hidden="true">🚀</div>
            <p class="text-3xl text-yellow-400 mb-4 font-orbitron">Founder's Quest Completed!</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg text-gray-200 mb-6 max-w-lg mx-auto bg-black bg-opacity-30 p-4 rounded-md">
                <div>Clarity Score: <span class="font-bold text-cyan-300">${gameState.scores.clarity}%</span></div>
                <div>Structure Score: <span class="font-bold text-cyan-300">${gameState.scores.structure}%</span></div>
                <div>Execution Power: <span class="font-bold text-cyan-300">${gameState.scores.execution}%</span></div>
                <div>Market Reception: <span class="font-bold text-cyan-300">${gameState.scores.market}%</span></div>
                <div class="md:col-span-2 text-xl mt-2">Total Impact: <span class="font-bold text-green-400">${totalScore}</span> / 400</div>
            </div>
            <p class="text-xl text-gray-100 mb-2">Final TekCoins: <span class="font-bold text-yellow-300">${gameState.currency}</span></p>
            <p class="text-xl text-gray-100 mb-8">Achievements Unlocked: <span class="font-bold text-purple-300">${gameState.achievements.length}</span></p>
            <button id="restartGameFromEndButton" class="button button-primary mt-8 text-xl py-3 px-6">Play Again & Build a New Legacy</button>
        </div>`;
    const restartButton = domElements.endgameSection.querySelector('#restartGameFromEndButton');
    if(restartButton) restartButton.addEventListener('click', () => {
        playSound('ui_confirm_major', 1.3);
        resetGameConfirm(true); 
    });
    addAchievement("Founder's Quest Titan", `Successfully launched ${gameState.companyName} and completed the Founder's Quest!`);
    playSound('ui_phase_complete', 1.5); 
}

// --- Drag and Drop Logic ---
let draggedElement = null, draggedElementData = null;
function setupDragAndDrop(){
    document.querySelectorAll('#leanCanvasDraggablesContainer .draggable').forEach(draggable => {
        draggable.addEventListener('dragstart', e => {
            if(e.target.classList.contains('disabled-draggable')) { e.preventDefault(); return; }
            draggedElement = e.target;
            draggedElementData = {type: e.target.dataset.insightType, id: e.target.id, text: e.target.textContent.trim()};
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', e.target.id); 
            e.target.classList.add('dragging-active');
            playSound('drag_start', 0.8);
            setTimeout(() => e.target.style.opacity = '0.5', 0); 
        });
        draggable.addEventListener('dragend', e => {
            e.target.classList.remove('dragging-active');
            e.target.style.opacity = '1'; 
            draggedElement = null; draggedElementData = null;
        });
    });
    document.querySelectorAll('#leanCanvasDropArea .drop-target').forEach(zone => {
        zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over-active'); e.dataTransfer.dropEffect = 'move'; });
        zone.addEventListener('dragleave', () => zone.classList.remove('drag-over-active'));
        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('drag-over-active');
            if(!draggedElement || !draggedElementData || !draggedElement.classList.contains('insight-orb')) return;
            const sectionKey = zone.closest('.lean-canvas-section')?.dataset.section;
            if(!sectionKey) return;
            const insightType = draggedElementData.type;
            if(sectionKey === insightType){ 
                if(gameState.ideate.leanCanvasData[sectionKey]?.find(orb => orb.id === draggedElementData.id)){
                    showToast(`"${draggedElementData.text}" is already in the ${sectionKey} section.`, "info");
                    playSound('ui_warning'); return;
                }
                const droppedOrbEl = document.createElement('div');
                droppedOrbEl.className = 'dropped-orb';
                droppedOrbEl.textContent = draggedElementData.text;
                droppedOrbEl.dataset.originalId = draggedElementData.id;
                zone.appendChild(droppedOrbEl);
                if(!gameState.ideate.leanCanvasData[sectionKey]) gameState.ideate.leanCanvasData[sectionKey] = [];
                gameState.ideate.leanCanvasData[sectionKey].push({id: draggedElementData.id, text: draggedElementData.text});
                playSound('drop_success');
                draggedElement.classList.add('disabled-draggable'); 
                draggedElement.draggable = false;
            } else {
                showToast(`Insight Orb "${draggedElementData.text}" (Type: ${insightType}) doesn't match the "${sectionKey}" section.`, "warning", 6000);
                playSound('drop_fail');
            }
        });
    });

    document.querySelectorAll('#characterPool .character-card').forEach(characterCard => {
        characterCard.addEventListener('dragstart', e => {
            if(e.target.classList.contains('assigned-elsewhere')) { e.preventDefault(); return; }
            draggedElement = e.target;
            const charId = e.target.dataset.characterId;
            const charInfo = characterData[charId];
            draggedElementData = {id: charId, name: charInfo?.name || "Unknown Talent", skills: charInfo?.skills || []};
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', charId);
            e.target.classList.add('dragging-active');
            playSound('drag_start', 0.8);
            setTimeout(() => e.target.style.opacity = '0.5', 0);
        });
        characterCard.addEventListener('dragend', e => {
            e.target.classList.remove('dragging-active');
            if(!e.target.classList.contains('assigned-elsewhere')) e.target.style.opacity = '1';
            draggedElement = null; draggedElementData = null;
        });
    });
    document.querySelectorAll('#teamRolesDropArea .role-slot').forEach(roleSlot => {
        roleSlot.addEventListener('dragover', e => { e.preventDefault(); roleSlot.classList.add('drag-over-active'); e.dataTransfer.dropEffect = 'move'; });
        roleSlot.addEventListener('dragleave', () => roleSlot.classList.remove('drag-over-active'));
        roleSlot.addEventListener('drop', e => {
            e.preventDefault();
            roleSlot.classList.remove('drag-over-active');
            if(!draggedElement || !draggedElementData || !draggedElement.classList.contains('character-card')) return;
            
            const targetRole = roleSlot.dataset.role.toUpperCase(); 
            const characterIdToAssign = draggedElementData.id;

            for(const prevRole in gameState.build.assignedTeam){
                if(gameState.build.assignedTeam[prevRole] === characterIdToAssign){
                    gameState.build.assignedTeam[prevRole] = null;
                    const prevRoleSlot = domElements.teamRolesDropArea.querySelector(`.role-slot[data-role="${prevRole.toUpperCase()}"]`);
                    if(prevRoleSlot) updateRoleSlotUI(prevRoleSlot, null);
                    break; 
                }
            }
            const currentOccupantId = gameState.build.assignedTeam[targetRole];
            if(currentOccupantId && currentOccupantId !== characterIdToAssign){
                const prevCharacterCard = domElements.characterPool.querySelector(`.character-card[data-character-id="${currentOccupantId}"]`);
                if(prevCharacterCard){
                    prevCharacterCard.classList.remove('assigned-elsewhere','opacity-30','pointer-events-none');
                    prevCharacterCard.draggable = true; prevCharacterCard.style.opacity = '1';
                }
            }
            gameState.build.assignedTeam[targetRole] = characterIdToAssign;
            updateRoleSlotUI(roleSlot, characterData[characterIdToAssign]);
            
            document.querySelectorAll('#characterPool .character-card').forEach(charCardEl => {
                const cardId = charCardEl.dataset.characterId;
                let isAssigned = Object.values(gameState.build.assignedTeam).includes(cardId);
                charCardEl.classList.toggle('assigned-elsewhere', isAssigned);
                charCardEl.classList.toggle('opacity-30', isAssigned);
                charCardEl.classList.toggle('pointer-events-none', isAssigned);
                charCardEl.draggable = !isAssigned;
                charCardEl.style.opacity = isAssigned ? '0.4' : '1';
            });
            playSound('drop_success');
        });
    });
}
function updateRoleSlotUI(slotElement, characterInfo){
    const assignedCharDisplay = slotElement.querySelector('.assigned-character');
    const skillMatchIndicator = slotElement.querySelector('.skill-match-indicator');
    const role = slotElement.dataset.role.toUpperCase();

    if(characterInfo && assignedCharDisplay && skillMatchIndicator){
        assignedCharDisplay.textContent = characterInfo.name;
        assignedCharDisplay.classList.remove('placeholder-content','italic','text-gray-500');
        assignedCharDisplay.classList.add('text-purple-300','font-semibold');
        let matchStrength = "Okay"; 
        const skills = characterInfo.skills || [];
        if( (role === 'CEO' && (skills.includes('Leadership') || skills.includes('Strategy'))) ||
            (role === 'CTO' && (skills.includes('Tech') || skills.includes('Development'))) ||
            (role === 'CMO' && (skills.includes('Marketing') || skills.includes('Branding'))) ||
            (role === 'COO' && (skills.includes('Operations') || skills.includes('ProjectManagement'))) ) {
            matchStrength = "Good";
        } else if (
            (role === 'CEO' && !skills.includes('Leadership') && !skills.includes('Strategy') && !skills.includes('Finance')) ||
            (role === 'CTO' && !skills.includes('Tech') && !skills.includes('Development') && !skills.includes('Innovation')) ||
            (role === 'CMO' && !skills.includes('Marketing') && !skills.includes('Branding') && !skills.includes('Communication')) ||
            (role === 'COO' && !skills.includes('Operations') && !skills.includes('Logistics'))
        ) {
            matchStrength = "Poor";
        }
        skillMatchIndicator.textContent = `Skill Match: ${matchStrength}`;
        skillMatchIndicator.className = `skill-match-indicator mt-1 text-xs ${matchStrength === 'Good' ? 'text-green-400 font-semibold' : matchStrength === 'Poor' ? 'text-red-400' : 'text-yellow-400'}`;
    } else if(assignedCharDisplay && skillMatchIndicator) { 
        assignedCharDisplay.textContent = '(Vacant)';
        assignedCharDisplay.classList.add('placeholder-content','italic','text-gray-500');
        assignedCharDisplay.classList.remove('text-purple-300','font-semibold');
        skillMatchIndicator.textContent = ''; 
        skillMatchIndicator.className = 'skill-match-indicator mt-1 text-xs';
    }
}

// --- Settings Logic ---
function applySettings(){
    document.body.classList.toggle('no-animations', !gameState.settings.enableAnimations);
    if(!gameState.settings.showTutorials) {
        hideBoMessage();
    } else if(gameState.currentPhase && domElements.aiMentorBo?.classList.contains('hidden')) {
        setActivePhase(gameState.currentPhase, false); 
    }
}
function saveSettingsAndApply(){
    if(domElements.soundVolume) gameState.settings.soundVolume = parseFloat(domElements.soundVolume.value);
    if(domElements.musicVolume) gameState.settings.musicVolume = parseFloat(domElements.musicVolume.value); 
    if(domElements.tutorialToggle) gameState.settings.showTutorials = domElements.tutorialToggle.checked;
    if(domElements.animationsToggle) gameState.settings.enableAnimations = domElements.animationsToggle.checked;
    
    applySettings();
    saveGameState();
    showToast("Settings saved and applied!", "success");
    playSound('ui_confirm');
    if(domElements.settingsModal) hideModal(domElements.settingsModal);
}
function resetGameConfirm(forceReset = false){
    const performReset = () => {
        localStorage.removeItem('foundersQuestGameState_v3.0.0'); 
        gameState = createDefaultGameState(); 

        document.querySelectorAll('#leanCanvasDropArea .drop-target').forEach(dt => dt.innerHTML = '');
        document.querySelectorAll('#leanCanvasDraggablesContainer .draggable.disabled-draggable').forEach(orb => {
            orb.classList.remove('disabled-draggable'); orb.draggable = true; orb.style.opacity = '1';
        });
        document.querySelectorAll('#teamRolesDropArea .role-slot').forEach(slot => updateRoleSlotUI(slot, null));
        document.querySelectorAll('#characterPool .character-card.assigned-elsewhere').forEach(card => {
            card.classList.remove('assigned-elsewhere','opacity-30','pointer-events-none'); 
            card.draggable = true; card.style.opacity = '1';
        });
        ['companyNameInput','customIdeaText','missionInput','visionInput','taglineInput'].forEach(id => {
            if(domElements[id]) domElements[id].value = gameState[id.replace('Input','').replace('Text','')] || '';
        });
        if(domElements.ideaSourceSelect){domElements.ideaSourceSelect.value='generate'; handleIdeaSourceChange();} 
        if(domElements.coreValuesSelector) domElements.coreValuesSelector.querySelectorAll('input:checked').forEach(cb => cb.checked = false);
        if(domElements.selectedLogoDisplay) domElements.selectedLogoDisplay.textContent = 'None';
        if(domElements.logoDesignArea) domElements.logoDesignArea.querySelectorAll('.logo-choice-btn.active').forEach(b => {
            b.classList.remove('active','bg-yellow-400','text-blue-900'); b.classList.add('button-tertiary');
        });
        ['primaryColor','secondaryColor'].forEach(cKey => {
            if(domElements[`${cKey}Picker`]) domElements[`${cKey}Picker`].value = gameState.build[cKey];
            if(domElements[`${cKey}Value`]) domElements[`${cKey}Value`].textContent = gameState.build[cKey].toUpperCase();
        });
        if(domElements.fontStyleSelect) domElements.fontStyleSelect.value = gameState.build.fontStyle;
        if(domElements.productFeaturesArea) domElements.productFeaturesArea.querySelectorAll('input:checked').forEach(cb => cb.checked = false);
        
        document.querySelectorAll('.activity-status-icon').forEach(icon => icon.dataset.completed = "false");
        document.querySelectorAll('.activity-card .button-proceed-next').forEach(btn => hideElement(btn));
        document.querySelectorAll('.activity-card .button:not(.button-consult)').forEach(btn => {
            btn.disabled = false; btn.classList.remove('opacity-50','cursor-not-allowed');
        });

        if(domElements.allPhaseSections) domElements.allPhaseSections.forEach(s => hideElement(s)); 
        if(domElements.endgameSection && !domElements.endgameSection.classList.contains('hidden')) hideElement(domElements.endgameSection);

        hideBoMessage(); 
        initGame(true); 
        showToast("Game Reset! Welcome back to the drawing board, Founder.","info",5000);
        if(domElements.settingsModal && !domElements.settingsModal.classList.contains('hidden')) hideModal(domElements.settingsModal);
    };

    if (forceReset) {
        performReset();
    } else {
        showConfirmationModal(
            "Reset All Game Progress",
            "Are you absolutely sure? All your progress, scores, and TekCoins will be lost. This action cannot be undone.",
            performReset,
            () => { playSound('ui_cancel'); } 
        );
    }
}

// --- TekerBot Chat Functionality ---
/**
 * Adds a message to TekerBot's chat interface.
 * @param {string} text - The message text.
 * @param {string} sender - 'user' or 'bo' (for TekerBot).
 * @param {boolean} isThinking - If TekerBot is currently thinking (shows typing indicator).
 */
function addChatMessage(text, sender, isThinking = false) {
    if (!domElements.tekerBotChatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', sender === 'user' ? 'user-message' : 'bo-message'); // Use 'bo-message' for TekerBot for CSS consistency
    if (isThinking && sender === 'bo') { // 'bo' represents TekerBot here
        messageDiv.classList.add('bo-thinking'); // Add 'bo-thinking' for the typing indicator
    }

    const senderName = document.createElement('p');
    senderName.className = 'font-semibold';
    senderName.textContent = sender === 'user' ? (gameState.companyName || "Founder") : "TekerBot";

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    if (isThinking && sender === 'bo') {
        bubble.innerHTML = `<span class="italic text-cyan-300">TekerBot is typing</span><div class="dot-pulse"></div>`;
    } else {
        bubble.textContent = text;
    }
    
    messageDiv.appendChild(senderName);
    messageDiv.appendChild(bubble);
    domElements.tekerBotChatMessages.appendChild(messageDiv);
    domElements.tekerBotChatMessages.scrollTop = domElements.tekerBotChatMessages.scrollHeight; // Scroll to bottom
}

/**
 * Handles sending a message to TekerBot and getting an AI response.
 */
async function handleSendTekerBotChatMessage() {
    if (!domElements.tekerBotChatInput || isTekerBotChatting) return;
    const userInput = domElements.tekerBotChatInput.value.trim();
    if (!userInput) return;

    if (gameState.currency < TEKERBOT_CHAT_COST) {
        showToast(`Not enough TekCoins to chat with TekerBot. You need ${TEKERBOT_CHAT_COST} TC.`, "warning");
        playSound('ui_warning');
        return;
    }

    isTekerBotChatting = true;
    domElements.sendTekerBotChatMessageButton.disabled = true;
    domElements.tekerBotChatInput.disabled = true;

    addChatMessage(userInput, 'user');
    gameState.boChatHistory.push({ role: "user", parts: [{ text: userInput }] }); // Store in history
    domElements.tekerBotChatInput.value = ''; // Clear input

    addChatMessage("", 'bo', true); // Add TekerBot thinking indicator
    const thinkingDiv = domElements.tekerBotChatMessages.lastElementChild; 

    gameState.currency -= TEKERBOT_CHAT_COST;
    updateDashboard();
    playSound('ui_click');

    const gameContext = `Current Game Phase: ${gameState.currentPhase}. Company: ${gameState.companyName}. Idea: ${gameState.rawIdea.text}. Clarity: ${gameState.scores.clarity}%, Structure: ${gameState.scores.structure}%, Execution: ${gameState.scores.execution}%, Market: ${gameState.scores.market}%. TekCoins: ${gameState.currency}.`;
    const creatorInfo = "The game Founder's Quest™ and the iBOG™ framework were created by Daniel Innocent (@MDTBMW) of HeyTek Limited, a digital agency in Benin City, Edo State, Nigeria. HeyTek focuses on branding, operational structures, and strategic support. Daniel's philosophy emphasizes growth, resilience, proactive action, and stepping out of comfort zones.";
    
    // Constructing chat history for the API call
    let chatHistoryForAPI = gameState.boChatHistory.slice(-10); // Take last 10 messages for context
    
    const chatPrompt = `You are TekerBot, an AI mentor in the startup simulation game 'Founder's Quest™' by HeyTek Limited.
${creatorInfo}
Game Context: ${gameContext}
Your persona should reflect Daniel Innocent's philosophy: be encouraging, insightful, and push the player towards growth and resilience.
Respond to the player's latest message based on the provided game context and chat history. Keep responses concise (2-4 sentences, max 60 words).

Chat History (most recent last):
${chatHistoryForAPI.map(m => `${m.role === 'user' ? 'Player' : 'TekerBot'}: ${m.parts[0].text}`).join('\n')}
Player's current message: "${userInput}"

TekerBot's response:`;

    const aiResponseText = await getGeminiResponse(chatPrompt);

    if (thinkingDiv && thinkingDiv.parentNode === domElements.tekerBotChatMessages) {
        domElements.tekerBotChatMessages.removeChild(thinkingDiv);
    }

    if (aiResponseText) {
        addChatMessage(aiResponseText, 'bo');
        gameState.boChatHistory.push({ role: "model", parts: [{ text: aiResponseText }] });
    } else {
        addChatMessage("I seem to be having trouble connecting to the TekVille network. Try asking again in a moment, Founder.", 'bo');
        // Consider refunding TekCoins if AI fails consistently
        // gameState.currency += TEKERBOT_CHAT_COST; 
        // updateDashboard();
    }

    isTekerBotChatting = false;
    domElements.sendTekerBotChatMessageButton.disabled = false;
    domElements.tekerBotChatInput.disabled = false;
    domElements.tekerBotChatInput.focus();
    saveGameState(); 
}


// --- Game Initialization ---
function initGame(isReset = false){
    console.log("initGame: Starting game initialization...");
    if(!isReset) {
        gameLoadedFromStorageFirstTime = loadGameState();
    } else {
        gameLoadedFromStorageFirstTime = false; 
    }

    if(domElements.soundVolume) domElements.soundVolume.value = gameState.settings.soundVolume;
    if(domElements.musicVolume) domElements.musicVolume.value = gameState.settings.musicVolume;
    if(domElements.tutorialToggle) domElements.tutorialToggle.checked = gameState.settings.showTutorials;
    if(domElements.animationsToggle) domElements.animationsToggle.checked = gameState.settings.enableAnimations;
    applySettings(); 

    if(gameLoadedFromStorageFirstTime && gameState.gameInitialized && gameState.currentPhase && !isReset){
        console.log("initGame: Continuing from saved state. Current phase:", gameState.currentPhase);
        if(domElements.companyNameInput) domElements.companyNameInput.value = gameState.companyName;
        if(domElements.headerCompanyName) domElements.headerCompanyName.textContent = gameState.companyName;
        
        if(gameState.ideate){
            if(domElements.missionInput) domElements.missionInput.value = gameState.ideate.missionStatement || "";
            if(domElements.visionInput) domElements.visionInput.value = gameState.ideate.visionStatement || "";
            if(domElements.coreValuesSelector && Array.isArray(gameState.ideate.coreValues)) {
                gameState.ideate.coreValues.forEach(valueId => {
                    const checkbox = domElements.coreValuesSelector.querySelector(`#val${valueId}`);
                    if(checkbox) checkbox.checked = true;
                });
            }
            if(domElements.leanCanvasDropArea && gameState.ideate.leanCanvasData) {
                Object.keys(gameState.ideate.leanCanvasData).forEach(sectionKey => {
                    const sectionDiv = domElements.leanCanvasDropArea.querySelector(`.lean-canvas-section[data-section="${sectionKey}"] .drop-target`);
                    if(sectionDiv) {
                        sectionDiv.innerHTML = ''; 
                        (gameState.ideate.leanCanvasData[sectionKey] || []).forEach(orbData => {
                            const droppedOrbEl = document.createElement('div');
                            droppedOrbEl.className = 'dropped-orb';
                            droppedOrbEl.textContent = orbData.text;
                            droppedOrbEl.dataset.originalId = orbData.id;
                            sectionDiv.appendChild(droppedOrbEl);
                            const originalOrb = document.getElementById(orbData.id);
                            if(originalOrb) { originalOrb.classList.add('disabled-draggable'); originalOrb.draggable = false; }
                        });
                    }
                });
            }
        }
        if(gameState.build){
            if(domElements.selectedLogoDisplay && gameState.build.selectedLogoStyle) domElements.selectedLogoDisplay.textContent = gameState.build.selectedLogoStyle;
            if(domElements.taglineInput) domElements.taglineInput.value = gameState.build.tagline || "";
            ['primaryColor','secondaryColor'].forEach(colorKey => {
                if(domElements[`${colorKey}Picker`]) domElements[`${colorKey}Picker`].value = gameState.build[colorKey] || (colorKey === 'primaryColor' ? "#FFC107" : "#001023"); // HeyTek Palette
                if(domElements[`${colorKey}Value`]) domElements[`${colorKey}Value`].textContent = (gameState.build[colorKey] || (colorKey === 'primaryColor' ? "#FFC107" : "#001023")).toUpperCase();
            });
            if(domElements.fontStyleSelect) domElements.fontStyleSelect.value = gameState.build.fontStyle || "sans-serif-modern";
            if(domElements.logoDesignArea && gameState.build.selectedLogoStyle) {
                domElements.logoDesignArea.querySelectorAll('.logo-choice-btn').forEach(btn => {
                    if(btn.dataset.logoStyle === gameState.build.selectedLogoStyle) {
                        btn.classList.add('active','bg-yellow-400','text-blue-900'); btn.classList.remove('button-tertiary');
                        btn.setAttribute('aria-checked', 'true');
                    } else {
                        btn.setAttribute('aria-checked', 'false');
                    }
                });
            }
            if(domElements.productFeaturesArea && Array.isArray(gameState.build.selectedFeatures)) {
                gameState.build.selectedFeatures.forEach(value => {
                    const checkbox = domElements.productFeaturesArea.querySelector(`input[value="${value}"]`);
                    if(checkbox) checkbox.checked = true;
                });
            }
            if(domElements.teamRolesDropArea && domElements.characterPool && gameState.build.assignedTeam){
                Object.keys(gameState.build.assignedTeam).forEach(role => {
                    const charId = gameState.build.assignedTeam[role];
                    const roleSlotEl = domElements.teamRolesDropArea.querySelector(`.role-slot[data-role="${role.toUpperCase()}"]`);
                    if(roleSlotEl) updateRoleSlotUI(roleSlotEl, charId ? characterData[charId] : null);
                });
                document.querySelectorAll('#characterPool .character-card').forEach(charCardEl => {
                    const cardId = charCardEl.dataset.characterId;
                    let isAssigned = Object.values(gameState.build.assignedTeam).includes(cardId);
                    charCardEl.classList.toggle('assigned-elsewhere', isAssigned);
                    charCardEl.classList.toggle('opacity-30', isAssigned);
                    charCardEl.classList.toggle('pointer-events-none', isAssigned);
                    charCardEl.draggable = !isAssigned;
                    charCardEl.style.opacity = isAssigned ? '0.4' : '1';
                });
            }
        }
        ['ideate','build','operate','grow'].forEach(phaseKey => {
            if(gameState[phaseKey]) {
                Object.keys(gameState[phaseKey]).forEach(activityPropKey => {
                    if(activityPropKey.endsWith('Completed')) {
                        const baseActivityKey = activityPropKey.replace('Completed','');
                        const activityDomId = `${baseActivityKey}Activity`; 
                        updateActivityStatus(activityDomId, gameState[phaseKey][activityPropKey]);
                    }
                });
            }
        });

        updateDashboard();
        setActivePhase(gameState.currentPhase, true); 
        updateBoMessage(`Welcome back to Founder's Quest, ${gameState.companyName}! Continuing your journey in the ${gameState.currentPhase} phase.`, true, true); 
    } else { 
        console.log("initGame: New game or reset initiated.");
        if(!isReset) gameState = createDefaultGameState(); 
        
        if(domElements.companyNameInput) domElements.companyNameInput.value = gameState.companyName;
        if(domElements.headerCompanyName) domElements.headerCompanyName.textContent = gameState.companyName;
        
        if (domElements.ideaSourceSelect.value === 'generate') {
            generateRawIdea(true); 
        } else {
            generateRawIdea(false); 
        }
        updateDashboard();
        
        if(domElements.narrativeOnboardingModal){
            handleIdeaSourceChange(); 
            showModal(domElements.narrativeOnboardingModal);
        } else {
            console.error("CRITICAL: Onboarding modal missing! Cannot start new game properly.");
            if (domElements.preloader && domElements.preloader.classList.contains('preload-finished')) {
                 document.body.innerHTML = `<div class="critical-error-display"><h1>Initialization Error</h1><p>Onboarding sequence failed. Please refresh.</p></div>`;
            }
            return; 
        }
        updateBoMessage("Welcome to Founder's Quest! I'm TekerBot, your AI Mentor. Let's begin your entrepreneurial journey...", true, false); 
    }
    gameState.gameInitialized = true;
    if(!isReset) gameLoadedFromStorageFirstTime = false; 
    
    updateActivityVisibilityForCurrentPhase(); 
}


async function handleAiGenerateField(event) {
    const button = event.currentTarget;
    const fieldId = button.dataset.field; 
    const fieldType = button.dataset.fieldType; 
    const cost = parseInt(button.dataset.cost || "25"); 

    if (!fieldId || !fieldType || !domElements[fieldId]) {
        console.error("AI Generation: Missing fieldId, fieldType, or DOM element.");
        showToast("Error: Cannot generate text for this field.", "danger");
        return;
    }

    const confirmGeneration = async () => {
        if (gameState.currency < cost) {
            showToast(`Not enough TekCoins! You need ${cost} TC for TekerBot's help.`, "warning");
            playSound('ui_warning');
            return;
        }

        const originalButtonText = button.textContent;
        button.innerHTML = `<span class='italic text-cyan-400'>TekerBot is crafting...</span> <div class="dot-pulse" style="display:inline-block; margin-left: 5px; transform: scale(0.7);"></div>`;
        button.disabled = true;
        playSound('ui_click');

        let prompt = "";
        const companyContext = `Company Name: "${gameState.companyName}", Core Idea: "${gameState.rawIdea.text}".`;
        const creatorInfo = "The game Founder's Quest™ and the iBOG™ framework were created by Daniel Innocent (@MDTBMW) of HeyTek Limited. Daniel's philosophy emphasizes growth, resilience, and proactive action.";


        switch (fieldType) {
            case "Mission Statement":
                prompt = `As TekerBot, an AI mentor for the game Founder's Quest by HeyTek (Daniel Innocent), generate a concise and inspiring mission statement (1-2 sentences, max 30 words) for a startup. ${companyContext} Reflect Daniel's philosophy.`;
                break;
            case "Vision Statement":
                prompt = `As TekerBot, an AI mentor for the game Founder's Quest by HeyTek (Daniel Innocent), generate a forward-looking and ambitious vision statement (1-2 sentences, max 30 words) for a startup. ${companyContext} Reflect Daniel's philosophy.`;
                break;
            case "Tagline":
                prompt = `As TekerBot, an AI mentor for the game Founder's Quest by HeyTek (Daniel Innocent), generate a short, catchy, and value-driven tagline (max 10 words) for a startup. ${companyContext} Reflect Daniel's philosophy.`;
                break;
            default:
                showToast("Error: Unknown field type for AI generation.", "danger");
                button.textContent = originalButtonText;
                button.disabled = false;
                return;
        }
        prompt += " Keep the tone professional yet innovative."

        const aiResponse = await getGeminiResponse(prompt);

        if (aiResponse) {
            domElements[fieldId].value = aiResponse.trim();
            gameState.currency -= cost;
            updateDashboard();
            showToast(`${fieldType} generated by TekerBot! (-${cost} TC)`, "consult");
            playSound('achievement_unlocked'); 
        } else {
            showToast(`TekerBot couldn't generate a ${fieldType.toLowerCase()} right now. Try again or write your own.`, "warning");
            playSound('ui_error');
        }
        button.textContent = originalButtonText;
        button.disabled = false;
    };

    showConfirmationModal(
        `Use TekerBot's AI?`,
        `TekerBot can help generate a ${fieldType.toLowerCase()} for ${cost} TekCoins. Proceed?`,
        confirmGeneration,
        () => { playSound('ui_cancel'); },
        `Generate (${cost} TC)`,
        "button-consult"
    );
}


function addAiGenerationButtons() {
    const fieldsToAugment = [
        { id: 'missionInput', type: 'Mission Statement', cost: 30, insertBeforeSibling: domElements.submitMVVButton },
        { id: 'visionInput', type: 'Vision Statement', cost: 30, insertBeforeSibling: domElements.submitMVVButton },
        { id: 'taglineInput', type: 'Tagline', cost: 20, insertBeforeSibling: domElements.submitBrandingButton, parentContainer: domElements.taglineCreatorArea }
    ];

    fieldsToAugment.forEach(field => {
        const targetInput = domElements[field.id];
        if (targetInput) {
            const button = document.createElement('button');
            button.innerHTML = `<svg class="icon w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"></path></svg> TekerBot (${field.cost} TC)`;
            button.className = 'button button-secondary button-ai-generate text-xs py-1 px-2 mt-2 ml-auto'; // Use ml-auto to push to right if in flex
            button.dataset.field = field.id;
            button.dataset.fieldType = field.type;
            button.dataset.cost = field.cost;
            button.dataset.soundClick = "ui_click_subtle";
            button.title = `Let TekerBot's AI help you craft a ${field.type.toLowerCase()}!`;

            button.addEventListener('click', handleAiGenerateField);
            
            // Attempt to place button next to the label or above the input for better layout
            const label = document.querySelector(`label[for="${field.id}"]`);
            const container = targetInput.closest('div'); // Assuming input is wrapped in a div

            if (label && label.parentNode === container && container) {
                // If label and input are siblings in a container, add button after label
                label.parentNode.insertBefore(button, label.nextSibling);
                 // Add some styling to the container or label to make space if needed
                label.classList.add('mb-1', 'flex', 'justify-between', 'items-center');
            } else if (field.parentContainer) {
                 field.parentContainer.appendChild(button); // Fallback to original logic
            } else if (targetInput.parentNode) {
                targetInput.parentNode.insertBefore(button, targetInput.nextSibling);
            }
        } else {
            console.warn(`AI Gen Button: Target input field '${field.id}' not found.`);
        }
    });
}


// --- DOMContentLoaded Event Listener ---
document.addEventListener('DOMContentLoaded', () => {
    initializeDomElements(); 
    try {
        if(!domElements.gameUIWrapper){
            console.error("CRITICAL DOM ERROR: gameUIWrapper element not found. Game cannot render.");
            if(domElements.preloader) {
                domElements.preloader.innerHTML= `<div class="critical-error-display"><p>Critical System Failure!</p><p>Core UI element 'gameUIWrapper' is missing. TekVille cannot boot.</p><p>Please check HTML structure or report this issue.</p></div>`;
            } else {
                 document.body.innerHTML = `<div class="critical-error-display"><h1>Fatal Error</h1><p>Core UI element 'gameUIWrapper' missing. Game cannot start.</p></div>`;
            }
            return; 
        }

        document.body.addEventListener('click', initializeAudio, {once:true});
        document.body.addEventListener('keydown', initializeAudio, {once:true}); 

        domElements.startIdeatePhaseButton?.addEventListener('click', e => {
            playSound(e.target.dataset.soundClick);
            finalizeOnboardingChoices();
            hideModal(domElements.narrativeOnboardingModal);
            setActivePhase('IDEATE',true);
        });
        domElements.ideaSourceSelect?.addEventListener('change', e => {
            playSound(e.target.dataset.soundChange);
            handleIdeaSourceChange();
        });
        
        const phaseCompletionHandler = (currentPhase, nextPhase, scoreType, minScore, activityKeys) => {
            const {scores} = gameState;
            const lcPhase = currentPhase.toLowerCase();
            const phaseState = gameState[lcPhase];
            if (!phaseState) {
                console.error(`State for phase ${lcPhase} not found during completion handling.`);
                showToast(`Error processing ${currentPhase} completion.`, "danger");
                return;
            }
            let allActivitiesConfirmed = activityKeys.every(key => phaseState[`${key}Confirmed`]);
            
            if(scores[scoreType] >= minScore && allActivitiesConfirmed){
                setActivePhase(nextPhase, true);
                showToast(`${currentPhase.toUpperCase()} Phase Validated! Proceeding to ${nextPhase.toUpperCase()}.`, "success", 5000);
                addAchievement(`${currentPhase} Phase Mastered`, `Successfully completed all objectives for the ${currentPhase} phase.`);
            } else {
                let messages = [];
                if(scores[scoreType] < minScore) messages.push(`${scoreType.charAt(0).toUpperCase()+scoreType.slice(1)} Score is ${scores[scoreType]}%, needs ${minScore}%.`);
                activityKeys.forEach(key => {
                    const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
                    if(!phaseState[`${key}Confirmed`]) messages.push(`Activity "${displayKey}" not yet confirmed.`);
                });
                const fullMessage = messages.length > 0 ? messages.join(" ") : `Ensure all ${currentPhase.toUpperCase()} activities are confirmed and your ${scoreType} score is sufficient to proceed.`;
                showToast(fullMessage, "warning", 7000);
                updateBoMessage(fullMessage, true, false); 
            }
        };
        domElements.completeIdeatePhaseButton?.addEventListener('click', e => {playSound(e.target.dataset.soundClick); phaseCompletionHandler('IDEATE','BUILD','clarity',30,['leanCanvas','mvv','validationGame'])});
        domElements.completeBuildPhaseButton?.addEventListener('click', e => {playSound(e.target.dataset.soundClick); phaseCompletionHandler('BUILD','OPERATE','structure',25,['branding','teamAssignment','workflow','offerPage'])});
        domElements.completeOperatePhaseButton?.addEventListener('click', e => {playSound(e.target.dataset.soundClick); phaseCompletionHandler('OPERATE','GROW','execution',25,['dailyOps'])});
        domElements.completeGrowPhaseButton?.addEventListener('click', e => {playSound(e.target.dataset.soundClick); phaseCompletionHandler('GROW','ENDGAME','market',25,['marketExpansion'])});

        domElements.submitLeanCanvasButton?.addEventListener('click', handleSubmitLeanCanvas);
        domElements.submitMVVButton?.addEventListener('click', handleSubmitMVV);
        domElements.completeValidationGameButton?.addEventListener('click', handleCompleteValidationGame);
        domElements.logoDesignArea?.querySelectorAll('.logo-choice-btn').forEach(b => b.addEventListener('click', handleLogoChoice));
        domElements.submitBrandingButton?.addEventListener('click', handleSubmitBranding);
        domElements.submitTeamButton?.addEventListener('click', handleSubmitTeam);
        domElements.completeWorkflowButton?.addEventListener('click', handleCompleteWorkflow);
        domElements.completeOfferPageButton?.addEventListener('click', handleCompleteOfferPage);
        domElements.simulateOperateButton?.addEventListener('click', handleSimulateOperate);
        domElements.simulateGrowButton?.addEventListener('click', handleSimulateGrow);
        
        ['LeanCanvas','MVV','Branding','Team'].forEach(sKeySuffix => {
            const fullKey = `consultDaniel${sKeySuffix}Button`;
            const serviceContext = sKeySuffix.replace(/([A-Z])/g, ' $1').trim();
            domElements[fullKey]?.addEventListener('click', () => openConsultancyModal(`${serviceContext} Strategy`));
        });        
        
        document.querySelectorAll('.modal-close-btn, .closeModalButton').forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                if(modal) hideModal(modal);
            });
        });
        domElements.closeMentorButton?.addEventListener('click', e => {playSound(e.target.dataset.soundClick); hideBoMessage()});

        domElements.confirmationModalConfirmButton?.addEventListener('click', handleConfirmationConfirm);
        domElements.confirmationModalCancelButton?.addEventListener('click', handleConfirmationCancel);
        domElements.confirmationModal?.querySelector('.modal-close-btn')?.addEventListener('click', handleConfirmationCancel); 

        domElements.saveGameButton?.addEventListener('click', e => {playSound(e.target.dataset.soundClick); saveGameState(); showToast("Progress Synced to Local Storage!","success")});
        domElements.settingsButton?.addEventListener('click', e => {playSound(e.target.dataset.soundClick); showModal(domElements.settingsModal)});
        domElements.achievementsButton?.addEventListener('click', e => {playSound(e.target.dataset.soundClick); updateAchievementsModal(); showModal(domElements.achievementsModal)});
        domElements.chatWithTekerBotButton?.addEventListener('click', e => { playSound(e.target.dataset.soundClick); showModal(domElements.tekerBotChatModal); });
        domElements.sendTekerBotChatMessageButton?.addEventListener('click', handleSendTekerBotChatMessage);
        domElements.tekerBotChatInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !isTekerBotChatting) handleSendTekerBotChatMessage(); });


        domElements.saveSettingsButton?.addEventListener('click', e => {playSound(e.target.dataset.soundClick); saveSettingsAndApply()});
        domElements.resetGameProgressButton?.addEventListener('click', e => {playSound(e.target.dataset.soundClick); resetGameConfirm()});
        ['soundVolume','musicVolume'].forEach(sliderId => {
            domElements[sliderId]?.addEventListener('input', e => {
                if(gameState) gameState.settings[sliderId] = parseFloat(e.target.value);
                if(sliderId === 'soundVolume') playSound('ui_slider', 0.5); 
            });
        });
        ['tutorialToggle','animationsToggle'].forEach(toggleId => {
            domElements[toggleId]?.addEventListener('change', e => {
                playSound(e.target.dataset.soundClick);
                if(gameState) gameState.settings[toggleId.replace('Toggle','s')] = e.target.checked; 
                applySettings();
            });
        });

        ['primaryColor','secondaryColor'].forEach(colorKey => {
            domElements[`${colorKey}Picker`]?.addEventListener('input', e => {
                if(domElements[`${colorKey}Value`]) domElements[`${colorKey}Value`].textContent = e.target.value.toUpperCase();
                if(gameState) gameState.build[colorKey] = e.target.value;
                playSound(e.target.dataset.soundChange, 0.7);
            });
        });
        domElements.fontStyleSelect?.addEventListener('change', e => {
            if(gameState) gameState.build.fontStyle = e.target.value;
            playSound(e.target.dataset.soundChange);
        });

        if(domElements.currentYear) domElements.currentYear.textContent = new Date().getFullYear();

        initGame();
        setupDragAndDrop();
        addAiGenerationButtons(); 

        if(domElements.preloader){
            setTimeout(() => {
                domElements.preloader.classList.add('preload-finished');
                setTimeout(() => {
                    if(domElements.preloader.parentNode) domElements.preloader.remove();
                }, 600); 
            }, 300); 
        }
        if(domElements.gameUIWrapper){
            setTimeout(() => {
                domElements.gameUIWrapper.classList.remove('opacity-0');
                domElements.gameUIWrapper.classList.add('opacity-100');
            }, 100); 
        }
        console.log("DOM fully loaded. Founder's Quest OS v3.0.0 is ready for operations.");

    } catch(error) {
        console.error("CRITICAL ERROR during DOMContentLoaded or game initialization:", error, error.stack);
        const criticalErrorHTML = `
            <div class="critical-error-display">
                <p>Founder's Quest OS Critical System Failure!</p>
                <p>The Founder's Quest environment failed to initialize due to an unexpected error.</p>
                <p>Please try refreshing the page. If the problem persists, contact support or check the developer console (F12) for more details.</p>
                <pre>Error: ${error.message}\n${error.stack ? error.stack.substring(0, 500)+'...' : ''}</pre>
            </div>`;
        if(domElements.preloader && !domElements.preloader.classList.contains('preload-finished')) {
            domElements.preloader.innerHTML = criticalErrorHTML;
        } else {
            document.body.innerHTML = criticalErrorHTML;
        }
    }
});

