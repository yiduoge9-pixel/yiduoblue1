const STORAGE_KEY = "miscommunicationMachineState_v11_dynamic_repair";
const MESSAGE_LIMIT = 120;
const REPAIRED_MESSAGE_LIMIT = 260;

function getDefaultState() {
  return {
    step: 1,
    maxStep: 1,
    message: "",
    scenario: "",
    tone: "",
    intensity: "medium",
    repair: "",
    repairedMessage: "",
    misreadings: {},
    receipt: {},
    usedDemo: false,
    feedback: {
      clarity: "",
      meaningfulStep: ""
    }
  };
}

const state = getDefaultState();

const presetMessages = [
  "I'm fine.",
  "No worries.",
  "Can we talk later?",
  "Maybe we should change this part.",
  "I don’t fully understand the feedback.",
  "我没事。",
  "没问题。",
  "迟点再说。"
];

const scenarios = [
  {
    id: "group",
    title: "Group Project Chat",
    tag: "Deadline Pressure",
    description: "You send this message after seeing unfinished work in a shared project chat.",
    contextNote: "11:48 PM, one day before deadline. Neutral suggestions can feel sharper under pressure.",
    platform: "Group Chat",
    risk: 8
  },
  {
    id: "tutor",
    title: "Email to Tutor",
    tag: "Academic Distance",
    description: "You are writing to your tutor because you want to understand feedback without sounding defensive.",
    contextNote: "Academic distance can make polite writing feel overly formal or emotionally careful.",
    platform: "Email",
    risk: 10
  },
  {
    id: "internship",
    title: "Message to Recruiter",
    tag: "Professional Risk",
    description: "You are replying to a recruiter and trying to sound capable, flexible and serious.",
    contextNote: "Professional pressure can make short messages feel less confident or too cautious.",
    platform: "Recruiter Message",
    risk: 12
  },
  {
    id: "friend",
    title: "Friend Conversation",
    tag: "Emotional Closeness",
    description: "Your friend asks if you are okay after you suddenly became quiet. You reply briefly because you are tired, not because you want to push them away.",
    contextNote: "In close relationships, short replies can feel more personal. A simple “I'm fine” may be read as distance, anger or hidden sadness.",
    platform: "Private Chat",
    risk: 8
  },
  {
    id: "translation",
    title: "Chinese-English Translation",
    tag: "Translation Gap",
    description: "The sentence moves between Chinese and English. Politeness, indirectness and emotional distance may change in translation.",
    contextNote: "Cultural assumptions can reshape the emotional meaning of a sentence.",
    platform: "Bilingual Message",
    risk: 18
  },
  {
    id: "cantonese",
    title: "Chinese-Cantonese Translation",
    tag: "Cantonese Local Tone",
    description: "Mandarin-style or written Chinese wording enters Cantonese communication. Warmth, humour, rhythm and relationship distance may shift.",
    contextNote: "Cantonese can carry social cues through particles, rhythm and local expressions.",
    platform: "Hong Kong / Cantonese Context",
    risk: 16
  }
];

const tones = [
  {
    id: "polite",
    title: "Polite",
    description: "You want to be respectful and avoid putting pressure on the other person.",
    meant: "I am trying to be considerate.",
    received: "You sound distant.",
    risk: 3
  },
  {
    id: "anxious",
    title: "Anxious",
    description: "You are worried, but you do not want your concern to appear too obvious.",
    meant: "I am unsure and need reassurance.",
    received: "You sound hesitant.",
    risk: 8
  },
  {
    id: "tired",
    title: "Tired",
    description: "You are exhausted, so your reply becomes shorter than usual.",
    meant: "I am tired, but I still care.",
    received: "You sound cold and uninterested.",
    risk: 12
  },
  {
    id: "honest",
    title: "Honest",
    description: "You want to express your real opinion clearly and sincerely.",
    meant: "I want to be clear, not hurtful.",
    received: "You sound critical.",
    risk: 6
  },
  {
    id: "indirect",
    title: "Indirect",
    description: "You soften your words because you do not want to sound too direct.",
    meant: "I am trying to protect the relationship.",
    received: "You sound unclear or avoidant.",
    risk: 14
  },
  {
    id: "formal",
    title: "Formal",
    description: "You want to sound professional, respectful and well-organised.",
    meant: "I am trying to be professional.",
    received: "You sound stiff and emotionally distant.",
    risk: 10
  }
];

const baseRepairOptions = [
  {
    id: "clarify",
    title: "Clarify Intention",
    tag: "Direct Repair",
    description: "Say the hidden intention directly, instead of leaving the reader to guess.",
    contextNote: "Best when the message may sound cold, defensive or unclear.",
    result: "The intention becomes easier to understand, but the tone may feel more direct.",
    scoreChange: -22
  },
  {
    id: "context",
    title: "Add Missing Context",
    tag: "Context Repair",
    description: "Explain the situation behind the short message so the reader understands why it sounded that way.",
    contextNote: "Best when the problem comes from missing background, timing or pressure.",
    result: "The background becomes clearer, although the message becomes longer.",
    scoreChange: -24
  },
  {
    id: "soften",
    title: "Soften Emotion",
    tag: "Tone Repair",
    description: "Keep the main meaning, but add warmth so the sentence feels less sharp or distant.",
    contextNote: "Best when the original message is correct but feels emotionally flat.",
    result: "The tone becomes warmer, while the original point is still kept.",
    scoreChange: -18
  },
  {
    id: "rewrite",
    title: "Rewrite Naturally",
    tag: "Full Rewrite",
    description: "Change the wording instead of only adding an explanation. The meaning stays similar, but the sentence feels more natural.",
    contextNote: "Best when the original wording sounds too stiff, too short or too literal.",
    result: "The sentence is rebuilt with a clearer emotional direction.",
    scoreChange: -20
  },
  {
    id: "boundary",
    title: "Set a Kind Boundary",
    tag: "Boundary Repair",
    description: "Make the limit clear while showing that the relationship or task still matters.",
    contextNote: "Best when you need time, space or a next step without sounding dismissive.",
    result: "The message becomes firmer, but the emotional damage is reduced.",
    scoreChange: -12
  },
  {
    id: "silent",
    title: "Pause the Reply",
    tag: "No Repair",
    description: "Do not send another message for now. This avoids escalation, but leaves the meaning unresolved.",
    contextNote: "Best only when replying immediately may make the situation worse.",
    result: "The conversation pauses, but the misunderstanding may remain.",
    scoreChange: 10
  }
];

const repairOptions = baseRepairOptions;

const intensityMap = {
  low: { title: "Low", score: -5 },
  medium: { title: "Medium", score: 0 },
  high: { title: "High", score: 12 }
};

const content = document.getElementById("content");
const progressFill = document.getElementById("progressFill");
const progressBar = document.querySelector(".progress-bar");
const stepButtons = document.querySelectorAll(".step");
const experienceSection = document.getElementById("experienceSection");

const aboutModal = document.getElementById("aboutModal");
const aboutCard = aboutModal ? aboutModal.querySelector(".modal-card") : null;
const caseStudyModal = document.getElementById("caseStudyModal");
const caseStudyCard = caseStudyModal ? caseStudyModal.querySelector(".modal-card") : null;

let lastFocusedElement = null;
let activeModal = null;

function render() {
  updateSteps();
  updateProgress();

  const renderCurrentStep = renderers[state.step];
  if (renderCurrentStep) renderCurrentStep();

  enhanceRenderedStep();
}

function updateSteps() {
  stepButtons.forEach((button) => {
    const step = Number(button.dataset.step);
    const locked = step > state.maxStep;

    button.classList.remove("active", "finished");
    button.removeAttribute("aria-current");
    button.setAttribute("aria-disabled", locked ? "true" : "false");
    button.disabled = locked;

    if (step === state.step) {
      button.classList.add("active");
      button.setAttribute("aria-current", "step");
    }

    if (step < state.step && step <= state.maxStep) {
      button.classList.add("finished");
    }
  });
}

function updateProgress() {
  const percentage = (state.step / 8) * 100;

  if (progressFill) progressFill.style.width = `${percentage}%`;
  if (progressBar) progressBar.setAttribute("aria-valuenow", String(state.step));
}

function setStep(step) {
  if (step < 1 || step > 8) return;

  state.step = step;
  state.maxStep = Math.max(state.maxStep, step);
  saveState();
  render();
}

function previousStep() {
  setStep(state.step - 1);
}

function showExperience() {
  document.body.classList.remove("landing-mode");

  if (experienceSection) {
    experienceSection.scrollIntoView({
      behavior: "auto",
      block: "start"
    });
  }
}

function backToLanding() {
  document.body.classList.add("landing-mode");

  window.scrollTo({
    top: 0,
    behavior: "auto"
  });
}

function enterExperienceWithTransition(callback) {
  const transitionScreen = document.getElementById("transitionScreen");

  if (!transitionScreen) {
    showExperience();
    if (typeof callback === "function") callback();
    return;
  }

  transitionScreen.classList.add("active");
  transitionScreen.setAttribute("aria-hidden", "false");

  window.setTimeout(() => {
    showExperience();
    if (typeof callback === "function") callback();
  }, 360);

  window.setTimeout(() => {
    transitionScreen.classList.remove("active");
    transitionScreen.setAttribute("aria-hidden", "true");
  }, 860);
}

function enhanceRenderedStep() {
  if (!content) return;

  const currentCard = content.querySelector(".card");
  if (!currentCard) return;

  currentCard.classList.add("stage-reveal");

  window.requestAnimationFrame(() => {
    currentCard.classList.add("visible");
  });
}

function createActionButtons(backText, nextText, nextAction) {
  return `
    <div class="actions">
      <button class="btn secondary" data-action="previous">${h(backText)}</button>
      <button class="btn" data-action="${h(nextAction)}">${h(nextText)}</button>
    </div>
  `;
}

function createReceiptActions() {
  return `
    <div class="actions">
      <button class="btn secondary" data-action="previous">Back</button>
      <button class="btn" data-action="download-receipt">Download Receipt</button>
      <button class="btn secondary" data-action="open-case-study">View Case Study</button>
      <button class="btn danger" data-action="restart">Restart</button>
    </div>
  `;
}

function createOptionCards(items, selectedId, action, isRed = false) {
  return items.map((item) => `
    <div
      class="option-card ${isRed ? "red" : ""} ${selectedId === item.id ? "selected" : ""}"
      data-action="${h(action)}"
      data-id="${h(item.id)}"
      role="button"
      tabindex="0">
      <div class="meta-line">${h(item.tag || item.title)}</div>
      <h3>${h(item.title)}</h3>
      <p>${h(item.description || item.effect || "")}</p>
      <p>${h(item.contextNote || item.result || "")}</p>
    </div>
  `).join("");
}

function createIntensityButtons() {
  return Object.entries(intensityMap).map(([id, item]) => `
    <button
      class="intensity-chip ${state.intensity === id ? "selected" : ""}"
      data-action="select-intensity"
      data-id="${h(id)}"
      type="button">
      <strong>${h(item.title)}</strong>
      <span>${h(getIntensityDescription(id))}</span>
    </button>
  `).join("");
}

function getIntensityDescription(id) {
  const copy = {
    low: "The feeling is present, but not urgent.",
    medium: "The feeling may change how the reader understands the message.",
    high: "The feeling strongly changes the risk of misreading."
  };

  return copy[id] || copy.medium;
}

function getRepairOptions() {
  const scenarioId = state.scenario || "general";

  const copy = {
    general: {
      clarify: {
        title: "Clarify Intention",
        tag: "Direct Repair",
        description: "Make the hidden intention visible so the reader does not have to guess your tone.",
        contextNote: "This changes the message from ambiguous to clear."
      },
      context: {
        title: "Add Missing Context",
        tag: "Context Repair",
        description: "Add the reason behind the message, such as timing, pressure or emotional state.",
        contextNote: "This gives the reader a better frame for understanding you."
      },
      soften: {
        title: "Make It Warmer",
        tag: "Tone Repair",
        description: "Keep the point but make the emotional surface softer and less distant.",
        contextNote: "This is useful when the original sentence feels too blunt."
      },
      rewrite: {
        title: "Rewrite Naturally",
        tag: "Full Rewrite",
        description: "Rebuild the sentence with different wording while keeping a similar meaning.",
        contextNote: "This avoids simply attaching a fixed apology to the original line."
      },
      boundary: {
        title: "Set a Kind Boundary",
        tag: "Boundary Repair",
        description: "Say what you need next while still showing care or respect.",
        contextNote: "This is helpful when you need time, space or a clearer next step."
      },
      silent: {
        title: "Pause the Reply",
        tag: "No Repair",
        description: "Stop the conversation temporarily, even though the misunderstanding may continue.",
        contextNote: "This choice shows how silence can become part of the misreading."
      }
    },
    friend: {
      clarify: {
        title: "Say You Are Not Upset",
        tag: "Relationship Repair",
        description: "Tell your friend the short reply came from tiredness, not rejection.",
        contextNote: "This reduces the chance that they read distance as anger."
      },
      context: {
        title: "Explain Why You Went Quiet",
        tag: "Emotional Context",
        description: "Add a small reason behind your silence so the friend understands the situation.",
        contextNote: "This makes the emotional background visible without overexplaining."
      },
      soften: {
        title: "Add Warmth",
        tag: "Soft Repair",
        description: "Keep the meaning, but make the reply sound more caring and less closed off.",
        contextNote: "This is useful when the original message is too short."
      },
      rewrite: {
        title: "Rewrite as a Caring Reply",
        tag: "Natural Reply",
        description: "Change the whole sentence into a more human, relaxed friend-message.",
        contextNote: "This makes the reply feel less like a defensive answer."
      },
      boundary: {
        title: "Ask for Space Kindly",
        tag: "Gentle Boundary",
        description: "Say you need some time while reassuring them the relationship is okay.",
        contextNote: "This repairs the message without forcing a long conversation."
      },
      silent: {
        title: "Leave It for Later",
        tag: "Unresolved",
        description: "Do not explain now. The friend may continue to guess your meaning.",
        contextNote: "This keeps the emotional gap open."
      }
    },
    tutor: {
      clarify: {
        title: "Ask for Clarification",
        tag: "Academic Repair",
        description: "Make it clear that you want to understand the feedback, not argue against it.",
        contextNote: "This helps the message sound more constructive."
      },
      context: {
        title: "Add Academic Context",
        tag: "Evidence Repair",
        description: "Explain which part of the feedback you are trying to understand.",
        contextNote: "This makes the request more specific and easier to answer."
      },
      soften: {
        title: "Sound Less Defensive",
        tag: "Tone Repair",
        description: "Keep your concern, but remove wording that may sound frustrated or challenging.",
        contextNote: "This is useful when writing to a tutor or assessor."
      },
      rewrite: {
        title: "Rewrite as Tutor Email",
        tag: "Formal Rewrite",
        description: "Turn the message into a clearer, respectful academic email sentence.",
        contextNote: "This makes the message sound more prepared and professional."
      },
      boundary: {
        title: "Request a Next Step",
        tag: "Action Repair",
        description: "Ask for what you should do next, instead of only stating confusion.",
        contextNote: "This turns uncertainty into a practical request."
      },
      silent: {
        title: "Do Not Reply Yet",
        tag: "Unresolved",
        description: "Avoid replying before thinking, but the question remains unanswered.",
        contextNote: "This may reduce immediate risk, but it does not repair the misunderstanding."
      }
    },
    group: {
      clarify: {
        title: "Clarify the Aim",
        tag: "Team Repair",
        description: "Explain that your message is about finishing the project, not blaming people.",
        contextNote: "This reduces the chance of sounding accusatory."
      },
      context: {
        title: "Add Deadline Context",
        tag: "Pressure Repair",
        description: "Mention the deadline or shared task so the message feels practical, not personal.",
        contextNote: "This helps the team understand why the message was sent."
      },
      soften: {
        title: "Make It Collaborative",
        tag: "Team Tone",
        description: "Use wording that invites action instead of sounding like criticism.",
        contextNote: "This keeps the group atmosphere less tense."
      },
      rewrite: {
        title: "Rewrite as Team Message",
        tag: "Group Rewrite",
        description: "Rebuild the sentence so it sounds like coordination rather than complaint.",
        contextNote: "This makes the message easier for teammates to accept."
      },
      boundary: {
        title: "Set a Task Boundary",
        tag: "Work Boundary",
        description: "Clearly say what needs to happen next while staying polite.",
        contextNote: "This is useful when shared responsibility is unclear."
      },
      silent: {
        title: "Wait for Others",
        tag: "Unresolved",
        description: "Stop messaging for now, although the group problem may continue.",
        contextNote: "This may delay conflict, but the project risk remains."
      }
    },
    internship: {
      clarify: {
        title: "Clarify Professional Intent",
        tag: "Recruiter Repair",
        description: "Make your intention sound confident, polite and work-focused.",
        contextNote: "This reduces the risk of sounding unsure."
      },
      context: {
        title: "Add Availability Context",
        tag: "Professional Context",
        description: "Explain your situation briefly so the recruiter can understand your reply.",
        contextNote: "This helps avoid misunderstanding around timing or flexibility."
      },
      soften: {
        title: "Sound More Confident",
        tag: "Tone Repair",
        description: "Keep the polite tone, but make the wording less hesitant.",
        contextNote: "This is useful for internship or job messages."
      },
      rewrite: {
        title: "Rewrite as Recruiter Reply",
        tag: "Professional Rewrite",
        description: "Change the sentence into a clearer professional response.",
        contextNote: "This makes the message feel more employable and prepared."
      },
      boundary: {
        title: "Set Availability Clearly",
        tag: "Schedule Repair",
        description: "Say what you can and cannot do without sounding difficult.",
        contextNote: "This keeps the reply practical and respectful."
      },
      silent: {
        title: "Delay the Reply",
        tag: "Risky Pause",
        description: "Wait before replying, but the recruiter may read silence as low interest.",
        contextNote: "This can increase professional uncertainty."
      }
    },
    translation: {
      clarify: {
        title: "Explain the Intended Meaning",
        tag: "Bilingual Repair",
        description: "State the emotional meaning behind the translated sentence.",
        contextNote: "This stops the translation from becoming too literal."
      },
      context: {
        title: "Add Cultural Context",
        tag: "Cultural Repair",
        description: "Explain the relationship or situation behind the wording.",
        contextNote: "This helps the English reader understand the softer Chinese intention."
      },
      soften: {
        title: "Naturalise the Tone",
        tag: "Tone Translation",
        description: "Make the English sound natural rather than word-for-word translated.",
        contextNote: "This keeps the meaning but reduces stiffness."
      },
      rewrite: {
        title: "Rewrite for English Reader",
        tag: "Translation Rewrite",
        description: "Rebuild the sentence for an English-speaking context while keeping the core meaning.",
        contextNote: "This makes the message sound culturally readable."
      },
      boundary: {
        title: "Make the Request Clear",
        tag: "Clear Request",
        description: "Turn indirect wording into a polite but understandable request.",
        contextNote: "This avoids the message sounding vague."
      },
      silent: {
        title: "Leave It Untranslated",
        tag: "Unresolved",
        description: "Keep the original wording, even though the reader may miss the emotional cues.",
        contextNote: "This keeps the cultural gap visible."
      }
    },
    cantonese: {
      clarify: {
        title: "Explain the Local Tone",
        tag: "Cantonese Repair",
        description: "Make the intended warmth or softness clearer in a Hong Kong context.",
        contextNote: "This repairs the gap between written Chinese and local spoken feeling."
      },
      context: {
        title: "Add Relationship Cue",
        tag: "Local Context",
        description: "Add a small cue that shows closeness, politeness or casualness.",
        contextNote: "This helps the message sound less stiff."
      },
      soften: {
        title: "Make It More Local",
        tag: "Tone Localisation",
        description: "Adjust rhythm and warmth so the line feels less like direct Mandarin translation.",
        contextNote: "This makes the sentence feel more socially natural."
      },
      rewrite: {
        title: "Rewrite in Cantonese Feel",
        tag: "Local Rewrite",
        description: "Rebuild the message with a warmer Cantonese communication style.",
        contextNote: "This keeps the meaning but changes the social texture."
      },
      boundary: {
        title: "Set Limit Gently",
        tag: "Gentle Local Boundary",
        description: "Say the limit clearly while keeping the tone soft and local.",
        contextNote: "This avoids sounding too direct."
      },
      silent: {
        title: "Keep It Unsaid",
        tag: "Unresolved",
        description: "Do not repair the sentence, so rhythm and relationship cues remain missing.",
        contextNote: "This keeps the misunderstanding open."
      }
    }
  };

  const selectedCopy = copy[scenarioId] || copy.general;

  return baseRepairOptions.map((option) => {
    return {
      ...option,
      ...(selectedCopy[option.id] || {})
    };
  });
}

function renderStep1() {
  content.innerHTML = `
    <div class="card compact-step">
      <div class="kicker">Step 1 / How It Works</div>

      <h2>Write. Misread. Repair.</h2>

      <p>
        This interactive experience turns a short message into a visible communication journey.
      </p>

      <div class="demo-panel">
        <div class="demo-card">
          <h3>Start with My Message</h3>

          <p>
            Write your own message and see how it might be interpreted in different social, cultural and language contexts.
          </p>

          <div class="actions">
            <button class="btn" data-action="start-own">Start with My Message</button>
          </div>
        </div>

        <div class="system-card">
          <h3>Use Demo Message</h3>

          <p>
            Try a prepared case: “I'm fine.” The demo lets you continue through context, intention, misreading and repair.
          </p>

          <div class="actions">
            <button class="btn danger" data-action="start-demo">Use Demo Message</button>
          </div>
        </div>
      </div>

      <div class="score-note">
        <strong>Project note:</strong> This project turns invisible communication gaps into a visible, testable and repairable experience.
      </div>

      <div class="actions">
        <button class="btn secondary" data-action="back-to-landing">Back to Intro</button>
        <button class="btn secondary" data-action="open-case-study">View Portfolio Case Study</button>
      </div>
    </div>
  `;
}

function renderStep2() {
  const messageLength = state.message.length;

  const demoNote = state.usedDemo ? `
    <div class="score-note">
      <strong>Demo mode:</strong> The message has been prepared for a friend conversation case. Continue to choose the context, intention and repair method yourself.
    </div>
  ` : "";

  content.innerHTML = `
    <div class="card">
      <div class="kicker">Step 2 / Message Input</div>

      <h2>What do you want to say?</h2>

      <p>
        Enter a message or select a preset sentence. Short messages often carry missing emotional information,
        so the system will later reinterpret this sentence through context, tone and digital distance.
      </p>

      ${demoNote}

      <div class="chat-shell">
        <div class="chat-row machine">
          <div class="message-bubble">Machine: What do you want to say?</div>
        </div>

        <div class="chat-row user">
          <div class="message-bubble" id="currentMessagePreview">
            You: ${state.message ? h(state.message) : "Waiting for your message..."}
          </div>
        </div>

        <textarea
          id="messageInput"
          maxlength="${MESSAGE_LIMIT}"
          placeholder="Type your message here...">${h(state.message)}</textarea>

        <p class="input-hint">
          <strong id="characterCount">${messageLength}</strong> / ${MESSAGE_LIMIT} characters. Short messages are more likely to lose tone.
        </p>

        <div class="chips">
          ${presetMessages.map((message) => `
            <button
              class="chip ${state.message === message ? "selected" : ""}"
              data-action="choose-preset"
              data-message="${h(message)}">
              ${h(message)}
            </button>
          `).join("")}
        </div>

        <div id="messageWarning"></div>
      </div>

      ${createActionButtons("Back", "Continue", "continue-message")}
    </div>
  `;
}

function renderStep3() {
  const demoNote = state.usedDemo ? `
    <div class="score-note">
      <strong>Suggested demo context:</strong> Choose “Friend Conversation” to follow the prepared case.
    </div>
  ` : "";

  content.innerHTML = `
    <div class="card">
      <div class="kicker">Step 3 / Communication Context</div>

      <h2>A message is never read alone.</h2>

      <p>
        Choose the pressure around the message. The same sentence can shift meaning depending on platform,
        relationship, deadline and cultural environment.
      </p>

      ${demoNote}

      <div class="option-grid">
        ${createOptionCards(scenarios, state.scenario, "select-scenario")}
      </div>

      <div id="scenarioWarning"></div>

      ${createActionButtons("Back", "Continue", "continue-scenario")}
    </div>
  `;
}

function renderStep4() {
  const intensity = intensityMap[state.intensity];

  const demoNote = state.usedDemo ? `
    <div class="score-note">
      <strong>Suggested demo intention:</strong> Choose “Tired” and set intensity to “High”.
    </div>
  ` : "";

  content.innerHTML = `
    <div class="card">
      <div class="kicker">Step 4 / Real Intention</div>

      <h2>What did you actually mean?</h2>

      <p>
        This step separates intention from perception. The system first asks what you meant,
        then shows how that meaning may be received differently.
      </p>

      ${demoNote}

      <div class="option-grid">
        ${createOptionCards(tones, state.tone, "select-tone", true)}
      </div>

      <div class="range-panel">
        <div class="range-panel-header">
          <span>How strong is this feeling?</span>
          <strong class="range-value" id="intensityText">${h(intensity.title)}</strong>
        </div>

        <div class="intensity-choice-grid">
          ${createIntensityButtons()}
        </div>
      </div>

      <div id="toneWarning"></div>

      ${createActionButtons("Back", "Continue", "continue-tone")}
    </div>
  `;
}

function renderStep5() {
  if (!state.misreadings.literal) createMisreadings();

  content.innerHTML = `
    <div class="card">
      <div class="kicker">Step 5 / Misread</div>

      <h2>The machine begins to misread.</h2>

      <p>
        The scan does not produce a correct answer. It simulates how digital systems and readers may reduce a message into partial signals.
      </p>

      <div class="scan-grid">
        <div class="scan-card">
          <div class="scan-tag">[Literal Scan]</div>
          <h3>Text Only</h3>
          <p>${h(state.misreadings.literal)}</p>
        </div>

        <div class="scan-card">
          <div class="scan-tag">[Emotional Scan]</div>
          <h3>Tone Loss</h3>
          <p>${h(state.misreadings.emotional)}</p>
        </div>

        <div class="scan-card">
          <div class="scan-tag">[Cultural Scan]</div>
          <h3>Cultural Shift</h3>
          <p>${h(state.misreadings.cultural)}</p>
        </div>

        <div class="scan-card">
          <div class="scan-tag">[Digital Context Scan]</div>
          <h3>Platform Effect</h3>
          <p>${h(state.misreadings.digital)}</p>
        </div>
      </div>

      ${createActionButtons("Back", "View Comparison", "continue-scan")}
    </div>
  `;
}

function renderStep6() {
  const scenario = getScenario();
  const tone = getTone();

  content.innerHTML = `
    <div class="card">
      <div class="kicker">Step 6 / Compare</div>

      <h2>What you meant is not what they received.</h2>

      <p>
        A short message can carry care, pressure, distance or fear. The interface makes that shift visible.
      </p>

      <div class="compare">
        <div class="compare-card meant">
          <h3>What you meant</h3>

          <div class="compare-list">
            <div>
              <strong>Message</strong>
              <span>${h(state.message)}</span>
            </div>

            <div>
              <strong>Inner meaning</strong>
              <span class="impact-text">${h(tone.meant)}</span>
            </div>

            <div>
              <strong>Context</strong>
              <span>${h(scenario.title)}</span>
            </div>

            <div>
              <strong>Intensity</strong>
              <span>${h(intensityMap[state.intensity].title)}</span>
            </div>
          </div>
        </div>

        <div class="compare-arrow">
          <div>
            <span>→</span>
            Context Lost in Transmission
          </div>
        </div>

        <div class="compare-card received">
          <h3>What they received</h3>

          <div class="compare-list">
            <div>
              <strong>Perceived meaning</strong>
              <span class="impact-text">${h(generatePerceivedTone())}</span>
            </div>

            <div>
              <strong>Possible reaction</strong>
              <span>${h(generatePossibleReaction())}</span>
            </div>

            <div>
              <strong>Risk reason</strong>
              <span>${h(generateRiskReason())}</span>
            </div>

            <div>
              <strong>Communication risk</strong>
              <span>${calculatePreRepairRisk()}%</span>
            </div>
          </div>
        </div>
      </div>

      ${createLanguageTransformPanel()}

      ${createActionButtons("Back", "Repair the Misreading", "continue-result")}
    </div>
  `;
}

function renderStep7() {
  const currentRepairOptions = getRepairOptions();

  const repairPreview = state.repair
    ? createRepairPreview()
    : `
      <div class="repair-preview clean-preview empty-preview">
        <div class="repair-step-label">2. Modified Result</div>
        <h3>Your repaired message will appear here.</h3>
        <p>
          Choose one repair method above. The system will generate a clearer version of your message here,
          and you can still edit it before creating the receipt.
        </p>
      </div>
    `;

  const demoNote = state.usedDemo ? `
    <div class="score-note">
      <strong>Suggested demo repair:</strong> Try “Rewrite as a Caring Reply” or “Add Warmth” to make the short reply feel less distant.
    </div>
  ` : "";

  content.innerHTML = `
    <div class="card">
      <div class="kicker">Step 7 / Repair</div>

      <h2>Choose how to repair the message.</h2>

      <p>
        The repair choices now change according to your context. The system can also rewrite the original sentence,
        not only add a fixed explanation after it.
      </p>

      ${demoNote}

      <div class="repair-workspace">
        <section class="repair-choice-area" aria-label="Choose repair method">
          <div class="repair-section-heading">
            <span>1. Choose a repair method</span>
            <p>Select how you want to fix the misunderstanding.</p>
          </div>

          <div class="option-grid repair-method-grid">
            ${createOptionCards(currentRepairOptions, state.repair, "select-repair")}
          </div>
        </section>

        <section class="repair-result-area" id="repairPreviewSlot" aria-live="polite">
          ${repairPreview}
        </section>
      </div>

      <div id="repairWarning"></div>

      ${createActionButtons("Back", "Generate Receipt", "continue-repair")}
    </div>
  `;
}

function renderStep8() {
  if (!state.receipt.message || !state.receipt.repairedMessage || !state.receipt.scoreBreakdown) {
    createReceipt();
  }

  const trace = getLanguageTrace();

  const traceLines = trace ? `
    ${createReceiptLine("Original Language", trace.original)}
    ${createReceiptLine("Literal Translation", trace.literal)}
    ${createReceiptLine("Cultural Repair", trace.repaired)}
    ${createReceiptLine("Language Note", trace.note)}
  ` : "";

  content.innerHTML = `
    <div class="card">
      <div class="kicker">Step 8 / Receipt</div>

      <h2>Miscommunication Receipt</h2>

      <p>
        A final artifact showing how one short message changed through context, misreading and repair.
      </p>

      <div class="receipt">
        <div class="receipt-header">
          <h3>MISCOMMUNICATION RECEIPT</h3>
          <p>Receipt No. ${h(state.receipt.receiptNumber)}</p>
        </div>

        <div class="receipt-meta">
          <div>
            <strong>Platform</strong>
            <span>${h(state.receipt.platform)}</span>
          </div>

          <div>
            <strong>Timestamp</strong>
            <span>${h(state.receipt.timestamp)}</span>
          </div>

          <div>
            <strong>Lost Cues</strong>
            <span>${h(state.receipt.lostCues)}</span>
          </div>
        </div>

        ${createReceiptLine("Original Message", state.receipt.message)}
        ${traceLines}
        ${createReceiptLine("Repaired Message", state.receipt.repairedMessage)}
        ${createReceiptLine("Context", state.receipt.scenario)}
        ${createReceiptLine("Real Intention", state.receipt.realTone)}
        ${createReceiptLine("Perceived Tone", state.receipt.perceivedTone)}
        ${createReceiptLine("Context Loss", `${state.receipt.contextLoss}%`)}
        ${createReceiptLine("Emotional Cost", state.receipt.emotionalCost)}
        ${createReceiptLine("Lost Signal", state.receipt.lostSignal)}
        ${createReceiptLine("Cultural Assumption", state.receipt.culturalAssumption)}
        ${createReceiptLine("Repair Method", state.receipt.repairMethod)}
        ${createReceiptLine("Repair Strategy", state.receipt.repairStrategy)}
        ${createReceiptLine("Final Result", state.receipt.finalOutcome)}

        <div class="barcode"></div>

        <div class="receipt-note">
          Thank you for using The Miscommunication Machine.<br />
          Meaning may vary depending on reader.
        </div>
      </div>

   
      ${createFeedbackPanel()}
      ${createReceiptActions()}
    </div>
  `;
}

const renderers = {
  1: renderStep1,
  2: renderStep2,
  3: renderStep3,
  4: renderStep4,
  5: renderStep5,
  6: renderStep6,
  7: renderStep7,
  8: renderStep8
};

document.addEventListener("click", (event) => {
  const stepButton = event.target.closest(".step");

  if (stepButton) {
    const step = Number(stepButton.dataset.step);
    if (step <= state.maxStep) {
      showExperience();
      setStep(step);
    }
    return;
  }

  const target = event.target.closest("[data-action]");
  if (!target) return;

  const action = target.dataset.action;

  if (action === "open-about") return openAbout();
  if (action === "close-about") return closeAbout();
  if (action === "open-case-study") return openCaseStudy();
  if (action === "close-case-study") return closeCaseStudy();

  if (action === "enter-experience") {
    enterExperienceWithTransition(() => setStep(1));
    return;
  }

  if (action === "back-to-landing") {
    backToLanding();
    return;
  }

  if (action === "start-own") {
    enterExperienceWithTransition(() => {
      state.usedDemo = false;
      saveState();
      setStep(2);
    });
    return;
  }

  if (action === "start-demo") {
    enterExperienceWithTransition(() => startDemo());
    return;
  }

  if (action === "choose-preset") {
    state.message = target.dataset.message.slice(0, MESSAGE_LIMIT);
    resetFromStep(2);
    saveState();
    updatePresetChoiceUI();
    clearWarning("messageWarning");
    return;
  }

  if (action === "continue-message") return saveMessage();

  if (action === "select-scenario") {
    state.scenario = target.dataset.id;
    resetFromStep(3);
    saveState();
    updateOptionSelection("select-scenario", state.scenario);
    clearWarning("scenarioWarning");
    return;
  }

  if (action === "continue-scenario") return confirmScenario();

  if (action === "select-tone") {
    state.tone = target.dataset.id;
    resetFromStep(4);
    saveState();
    updateOptionSelection("select-tone", state.tone);
    clearWarning("toneWarning");
    return;
  }

  if (action === "select-intensity") {
    state.intensity = target.dataset.id;
    resetFromStep(4);
    saveState();

    document.querySelectorAll('[data-action="select-intensity"]').forEach((button) => {
      button.classList.toggle("selected", button.dataset.id === state.intensity);
    });

    const intensityText = document.getElementById("intensityText");
    if (intensityText) intensityText.textContent = intensityMap[state.intensity].title;

    clearWarning("toneWarning");
    return;
  }

  if (action === "continue-tone") return confirmTone();
  if (action === "continue-scan") return setStep(6);
  if (action === "continue-result") return setStep(7);

  if (action === "select-repair") {
    state.repair = target.dataset.id;
    state.repairedMessage = generateRepairedMessage();
    resetFromStep(7);
    saveState();
    updateOptionSelection("select-repair", state.repair);
    clearWarning("repairWarning");

    const repairPreviewSlot = document.getElementById("repairPreviewSlot");
    if (repairPreviewSlot) repairPreviewSlot.innerHTML = createRepairPreview();
    return;
  }

  if (action === "continue-repair") return confirmRepair();
  if (action === "download-receipt") return downloadReceipt();

  if (action === "feedback-clarity") return setFeedback("clarity", target.dataset.value);
  if (action === "feedback-step") return setFeedback("meaningfulStep", target.dataset.value);
  if (action === "previous") return previousStep();
  if (action === "restart") return restart();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeActiveModal();
  if (event.key === "Tab" && activeModal) trapFocus(event);

  const optionCard = event.target.closest(".option-card");
  if (optionCard && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    optionCard.click();
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "messageInput") updateMessageInputFeedback(event.target);
  if (event.target.id === "repairedMessageInput") updateRepairedMessage(event.target);

  if (event.target.id === "intensityRange") {
    const value = Number(event.target.value);
    state.intensity = ["low", "medium", "high"][value];

    const intensityText = document.getElementById("intensityText");
    if (intensityText) intensityText.textContent = intensityMap[state.intensity].title;

    resetFromStep(4);
    saveState();
  }
});

function updatePresetChoiceUI() {
  const input = document.getElementById("messageInput");

  if (input) {
    input.value = state.message;
    updateMessageInputFeedback(input);
  }

  document.querySelectorAll('[data-action="choose-preset"]').forEach((chip) => {
    chip.classList.toggle("selected", chip.dataset.message === state.message);
  });
}

function updateOptionSelection(action, selectedId) {
  document.querySelectorAll(`[data-action="${action}"]`).forEach((card) => {
    card.classList.toggle("selected", card.dataset.id === selectedId);
  });
}

function updateMessageInputFeedback(input) {
  const value = input.value.slice(0, MESSAGE_LIMIT);
  const characterCount = document.getElementById("characterCount");
  const preview = document.getElementById("currentMessagePreview");

  if (characterCount) characterCount.textContent = String(value.length);
  if (preview) preview.textContent = value ? `You: ${value}` : "You: Waiting for your message...";
}

function updateRepairedMessage(input) {
  state.repairedMessage = input.value.slice(0, REPAIRED_MESSAGE_LIMIT);
  state.receipt = {};
  saveState();

  const characterCount = document.getElementById("repairedCharacterCount");
  if (characterCount) characterCount.textContent = String(state.repairedMessage.length);
}

function saveMessage() {
  const input = document.getElementById("messageInput");
  const value = input.value.trim().slice(0, MESSAGE_LIMIT);

  if (!value) {
    showWarning("messageWarning", "Please enter or select a message first.");
    return;
  }

  state.message = value;
  resetFromStep(2);
  saveState();
  setStep(3);
}

function confirmScenario() {
  if (!state.scenario) {
    showWarning("scenarioWarning", "Please select a communication context first.");
    return;
  }

  setStep(4);
}

function confirmTone() {
  if (!state.tone) {
    showWarning("toneWarning", "Please select your real intention first.");
    return;
  }

  createMisreadings();
  saveState();
  setStep(5);
}

function confirmRepair() {
  if (!state.repair) {
    showWarning("repairWarning", "Please select a repair method first.");
    return;
  }

  if (!state.repairedMessage.trim()) state.repairedMessage = generateRepairedMessage();

  createReceipt();
  saveState();
  setStep(8);
}

function startDemo() {
  showExperience();

  Object.assign(state, getDefaultState(), {
    step: 2,
    maxStep: 2,
    message: "I'm fine.",
    usedDemo: true
  });

  localStorage.removeItem(STORAGE_KEY);
  saveState();
  render();
}

function restart() {
  Object.assign(state, getDefaultState());
  localStorage.removeItem(STORAGE_KEY);
  showExperience();
  render();
}

function resetFromStep(step) {
  if (step <= 2) {
    state.scenario = "";
    state.tone = "";
    state.intensity = "medium";
    state.repair = "";
    state.repairedMessage = "";
    state.misreadings = {};
    state.receipt = {};
    state.feedback = { clarity: "", meaningfulStep: "" };
    state.maxStep = Math.min(state.maxStep, 2);
  }

  if (step === 3) {
    state.tone = "";
    state.intensity = "medium";
    state.repair = "";
    state.repairedMessage = "";
    state.misreadings = {};
    state.receipt = {};
    state.feedback = { clarity: "", meaningfulStep: "" };
    state.maxStep = Math.min(state.maxStep, 3);
  }

  if (step === 4) {
    state.repair = "";
    state.repairedMessage = "";
    state.misreadings = {};
    state.receipt = {};
    state.feedback = { clarity: "", meaningfulStep: "" };
    state.maxStep = Math.min(state.maxStep, 4);
  }

  if (step === 7) {
    state.receipt = {};
    state.feedback = { clarity: "", meaningfulStep: "" };
    state.maxStep = Math.min(state.maxStep, 7);
  }
}

function createMisreadings() {
  const scenario = getScenario();
  const tone = getTone();
  const intensity = intensityMap[state.intensity];

  if (state.scenario === "translation") {
    state.misreadings = {
      literal: `Message detected: “${state.message}”. The system reads the sentence as text, not as cultural intention.`,
      emotional: `Your intention is “${tone.title}” with ${intensity.title} intensity. In Chinese-English translation, emotional softness may become uncertainty, distance or excessive politeness.`,
      cultural: "Indirect politeness may be read as unclear, hesitant or emotionally distant when moved across Chinese and English communication norms.",
      digital: "The platform removes voice, timing and relationship cues. The translated message may feel more rigid than intended."
    };
    return;
  }

  if (state.scenario === "cantonese") {
    state.misreadings = {
      literal: `Message detected: “${state.message}”. The system treats Mandarin-style wording as directly transferable, but Cantonese communication often carries meaning through rhythm, particles and local expression.`,
      emotional: `Your intention is “${tone.title}” with ${intensity.title} intensity. In Cantonese context, softness, humour or directness may feel different from the original wording.`,
      cultural: "A sentence that feels polite in written Chinese may sound too formal, too distant or not local enough when received in a Cantonese-speaking context.",
      digital: "The platform flattens spoken rhythm, sentence-final particles and relationship cues, so the repaired meaning needs more explicit warmth."
    };
    return;
  }

  state.misreadings = {
    literal: `Message detected: “${state.message}”. The system cannot see facial expression, voice, hesitation or relationship history.`,
    emotional: `Your intention is “${tone.title}” with ${intensity.title} intensity. On screen, this may collapse into distance, pressure or avoidance.`,
    cultural: `In the context of “${scenario.title}”, politeness, directness and silence may be read differently across cultures.`,
    digital: "Risk reason: short text, missing body language and platform pressure. The message may feel colder than intended."
  };
}

function generatePossibleReaction() {
  if (state.scenario === "translation") {
    return "They may understand the words but misread the cultural intention behind the level of politeness, directness or emotional softness.";
  }

  if (state.scenario === "cantonese") {
    return "They may understand the sentence literally but feel that the tone is too formal, distant or not locally natural.";
  }

  if (state.scenario === "friend") {
    return "They may think you are upset with them, even if you only meant that you are tired.";
  }

  if (state.scenario === "group") {
    return "The group may read the message as criticism rather than coordination.";
  }

  if (state.scenario === "tutor") {
    return "The tutor may read the message as defensive, even if you are asking for clarity.";
  }

  if (state.scenario === "internship") {
    return "The recruiter may read the message as uncertainty or low confidence.";
  }

  return "They may react to the tone they imagine, rather than the intention you meant.";
}

function generateRiskReason() {
  const scenario = getScenario();
  const tone = getTone();
  const intensity = intensityMap[state.intensity];

  return `${scenario.platform} + ${tone.title} intention + ${intensity.title} emotional intensity creates a higher chance of tone loss.`;
}

function generatePerceivedTone() {
  const tone = getTone();

  const map = {
    polite: "Distant or overly careful",
    anxious: "Unsure or hesitant",
    tired: "Cold or uninterested",
    honest: "Critical or blunt",
    indirect: "Unclear or avoidant",
    formal: "Stiff or emotionally distant"
  };

  if (state.scenario === "friend" && state.tone === "tired") return "Cold, distant or secretly upset";
  if (state.scenario === "tutor" && state.tone === "honest") return "Defensive or challenging";
  if (state.scenario === "group" && state.tone === "honest") return "Blaming or impatient";
  if (state.scenario === "internship" && state.tone === "anxious") return "Not confident enough";
  if (state.scenario === "translation") return "Too literal, hesitant or culturally flat";
  if (state.scenario === "cantonese") return "Too formal, distant or not locally natural";

  return map[tone.id] || tone.received;
}

function createLanguageTransformPanel() {
  const trace = getLanguageTrace();
  if (!trace) return "";

  return `
    <div class="language-transform">
      <h3>Language Meaning Shift</h3>

      <p>
        This panel shows how meaning changes when the message moves across language and cultural tone.
      </p>

      <p class="trace-disclaimer">
        These transformations are hand-written design simulations for a fixed set of example
        phrases, not a live translation engine. See "About this project" for details.
      </p>

      <div class="trace-grid">
        <div class="trace-card">
          <strong>Original</strong>
          <span>${h(trace.original)}</span>
          <small>What the message starts as.</small>
        </div>

        <div class="trace-arrow">→</div>

        <div class="trace-card red">
          <strong>Literal Transfer</strong>
          <span>${h(trace.literal)}</span>
          <small>What may feel too direct, flat or translated.</small>
        </div>

        <div class="trace-arrow">→</div>

        <div class="trace-card dark">
          <strong>Cultural Repair</strong>
          <span>${h(trace.repaired)}</span>
          <small>${h(trace.note)}</small>
        </div>
      </div>
    </div>
  `;
}

function getLanguageTrace() {
  const message = state.message.trim();

  if (state.scenario === "translation") {
    if (containsChinese(message)) {
      return {
        original: message,
        literal: translateChineseToEnglishLiteral(message),
        repaired: translateChineseToEnglishRepaired(message),
        note: "The repair keeps the meaning but makes the English tone more socially readable."
      };
    }

    return {
      original: message,
      literal: "A direct English sentence with limited emotional background.",
      repaired: createEnglishRepairForTranslation(message),
      note: "The repair adds context so the message does not feel cold or overly literal."
    };
  }

  if (state.scenario === "cantonese") {
    return {
      original: message,
      literal: convertToCantoneseLiteral(message),
      repaired: convertToCantoneseRepaired(message),
      note: "The repair adds a warmer Cantonese-style rhythm rather than only translating the words."
    };
  }

  return null;
}

function translateChineseToEnglishLiteral(message) {
  if (message.includes("没事")) return "I am fine.";
  if (message.includes("没问题")) return "No problem.";
  if (message.includes("迟点")) return "Talk later.";
  return "A direct word-for-word English translation.";
}

function translateChineseToEnglishRepaired(message) {
  if (message.includes("没事")) return "I'm okay, just a bit tired. I still appreciate you checking in.";
  if (message.includes("没问题")) return "That works for me. Thank you for letting me know.";
  if (message.includes("迟点")) return "Can we talk a bit later? I want to reply properly when I have more energy.";
  return "I understand the main point, but I want to express it in a softer and clearer way.";
}

function createEnglishRepairForTranslation(message) {
  const lower = message.toLowerCase();

  if (lower.includes("fine")) return "I'm okay. I may sound quiet, but I do not mean to seem distant.";
  if (lower.includes("no worries")) return "No worries, that is okay with me. Thanks for explaining.";
  if (lower.includes("talk later")) return "Can we talk later? I want to give this a proper reply.";
  if (lower.includes("feedback")) return "Thank you for the feedback. Could you help me understand the main part I should improve?";
  return `${message} I want to make sure my tone is clear and respectful.`;
}

function convertToCantoneseLiteral(message) {
  if (message.includes("我没事")) return "我冇事。";
  if (message.includes("没问题")) return "冇問題。";
  if (message.includes("迟点")) return "遲啲再講。";
  if (message.toLowerCase().includes("i'm fine")) return "我冇事。";
  if (message.toLowerCase().includes("no worries")) return "冇問題。";
  return "A direct Cantonese transfer of the original sentence.";
}

function convertToCantoneseRepaired(message) {
  if (message.includes("我没事") || message.toLowerCase().includes("i'm fine")) {
    return "我冇事呀，只係有啲攰，唔係嬲你。";
  }

  if (message.includes("没问题") || message.toLowerCase().includes("no worries")) {
    return "冇問題呀，我明白嘅，多謝你同我講。";
  }

  if (message.includes("迟点") || message.toLowerCase().includes("talk later")) {
    return "我想遲啲再覆你，可以嗎？我想認真啲講。";
  }

  return "我明你意思，我想講清楚啲，唔想令你誤會。";
}

function calculatePreRepairRisk() {
  const scenario = getScenario();
  const tone = getTone();
  const intensity = intensityMap[state.intensity];

  let score = 35 + scenario.risk + tone.risk + intensity.score;

  if (state.message.length <= 12) score += 14;
  if (state.message.length <= 5) score += 8;
  if (containsChinese(state.message) && state.scenario !== "translation" && state.scenario !== "cantonese") score += 5;
  if (state.scenario === "translation" || state.scenario === "cantonese") score += 8;
  if (state.scenario === "friend" && state.tone === "tired") score += 10;
  if (state.scenario === "tutor" && state.tone === "honest") score += 8;
  if (state.scenario === "group" && state.tone === "honest") score += 7;

  return clamp(score, 8, 96);
}

function calculatePostRepairRisk() {
  const pre = calculatePreRepairRisk();
  const repair = getRepair();
  const change = repair ? repair.scoreChange : 0;

  return clamp(pre + change, 5, 98);
}

function createRepairPreview() {
  const repairedText = state.repairedMessage.trim()
    ? state.repairedMessage
    : generateRepairedMessage();

  return `
    <div class="repair-preview clean-preview">
      <label class="repair-textarea-label" for="repairedMessageInput">
        Modified Result
      </label>

      <textarea
        id="repairedMessageInput"
        maxlength="${REPAIRED_MESSAGE_LIMIT}"
        placeholder="Edit the repaired message here...">${h(repairedText)}</textarea>

      <p class="input-hint">
        <strong id="repairedCharacterCount">${repairedText.length}</strong> / ${REPAIRED_MESSAGE_LIMIT} characters.
        You can still edit this final repaired message.
      </p>
    </div>
  `;

}

function describeRepairDirection(repairId) {
  const scenario = getScenario();

  const general = {
    clarify: "Makes the hidden intention explicit.",
    context: "Adds the missing background behind the message.",
    soften: "Keeps the point but makes the tone warmer.",
    rewrite: "Changes the wording while keeping a similar meaning.",
    boundary: "Sets a limit without sounding dismissive.",
    silent: "Pauses the conversation without repairing the meaning."
  };

  const specific = {
    friend: {
      clarify: "Reassures the friend that the short reply is not rejection.",
      context: "Explains the emotional reason behind the short message.",
      soften: "Adds care so the reply feels less cold.",
      rewrite: "Turns the sentence into a warmer friend reply.",
      boundary: "Asks for space while protecting the relationship."
    },
    tutor: {
      clarify: "Shows that the aim is understanding feedback, not arguing.",
      context: "Adds academic context to make the request specific.",
      soften: "Reduces defensiveness in the tone.",
      rewrite: "Rebuilds the sentence as a respectful tutor email.",
      boundary: "Turns confusion into a practical next-step request."
    },
    group: {
      clarify: "Shows that the message is about coordination, not blame.",
      context: "Links the message to deadline pressure.",
      soften: "Makes the message sound more collaborative.",
      rewrite: "Rebuilds the sentence as a team update.",
      boundary: "Makes the next task clear."
    },
    internship: {
      clarify: "Makes the message sound confident and professional.",
      context: "Adds necessary availability or situation context.",
      soften: "Keeps politeness while reducing hesitation.",
      rewrite: "Rebuilds the sentence as a recruiter reply.",
      boundary: "States availability clearly."
    },
    translation: {
      clarify: "Explains the meaning behind the translated sentence.",
      context: "Adds cultural context to reduce literal misunderstanding.",
      soften: "Naturalises the translated tone.",
      rewrite: "Rebuilds the sentence for an English reader.",
      boundary: "Turns indirect wording into a clear polite request."
    },
    cantonese: {
      clarify: "Makes the intended local tone clearer.",
      context: "Adds relationship cues.",
      soften: "Makes the sentence feel more local and natural.",
      rewrite: "Rebuilds the sentence with Cantonese-style warmth.",
      boundary: "Sets a limit gently."
    }
  };

  return (specific[scenario.id] && specific[scenario.id][repairId]) || general[repairId] || "Repairs the message.";
}

function generateRepairedMessage() {
  const message = state.message.trim();
  const scenario = state.scenario || "general";
  const repair = state.repair || "rewrite";
  const tone = state.tone || "polite";
  const lower = message.toLowerCase();

  if (repair === "silent") {
    return "No new message is sent. The misunderstanding remains unresolved for now.";
  }

  if (scenario === "friend") {
    if (repair === "clarify") return "I'm not upset with you. I'm just a bit tired, so I may sound quieter than usual.";
    if (repair === "context") return "I'm okay, but today has been a lot. I might reply slowly, but I still appreciate you checking on me.";
    if (repair === "soften") return "I'm okay, thank you for asking. I just need a little time to rest.";
    if (repair === "rewrite") return "I'm okay, just tired. I don't want you to think I'm being distant.";
    if (repair === "boundary") return "Can I reply properly later? I care about this, but I need a little space first.";
  }

  if (scenario === "tutor") {
    if (lower.includes("feedback")) {
      if (repair === "clarify") return "Thank you for the feedback. I would like to understand it more clearly so I can improve my work.";
      if (repair === "context") return "Thank you for the feedback. I understand the overall point, but I am unsure which part I should focus on improving first.";
      if (repair === "soften") return "Thank you for your feedback. Could you please help me understand the main area I should revise?";
      if (repair === "rewrite") return "Thank you for your comments. Could you please clarify the key improvement I should prioritise in my next revision?";
      if (repair === "boundary") return "Could you please let me know the next step I should take to improve this work?";
    }

    if (repair === "clarify") return `I would like to clarify my intention. I am not trying to challenge the feedback, but to understand how I can improve.`;
    if (repair === "context") return `I wanted to add some context to my question so it is easier to understand what I am asking.`;
    if (repair === "soften") return `Thank you for your help. I wanted to ask this in a clearer and more respectful way.`;
    if (repair === "rewrite") return `Thank you for your feedback. Could you please help me understand how I can improve this part of my work?`;
    if (repair === "boundary") return `Could you please advise me on the most useful next step?`;
  }

  if (scenario === "group") {
    if (repair === "clarify") return "I just want to clarify that I'm trying to help us finish the project, not blame anyone.";
    if (repair === "context") return "Because the deadline is close, I think it would help if we quickly agree on what needs changing.";
    if (repair === "soften") return "Maybe we can adjust this part together so the final version feels stronger.";
    if (repair === "rewrite") return "Could we review this section and decide what needs to be changed before the deadline?";
    if (repair === "boundary") return "I can help with my part, but we need to confirm who is handling the remaining changes.";
  }

  if (scenario === "internship") {
    if (repair === "clarify") return "Thank you for your message. I am very interested in the opportunity and would be happy to discuss the next steps.";
    if (repair === "context") return "Thank you for your message. I wanted to explain my availability clearly so we can find the most suitable arrangement.";
    if (repair === "soften") return "Thank you for letting me know. I appreciate the opportunity and would be glad to follow up.";
    if (repair === "rewrite") return "Thank you for reaching out. I am interested in this role and would be happy to provide any further information you need.";
    if (repair === "boundary") return "I am available during this period, and I would be happy to discuss a suitable schedule.";
  }

  if (scenario === "translation") {
    if (containsChinese(message)) {
      if (repair === "clarify") return translateChineseToEnglishRepaired(message);
      if (repair === "context") return `${translateChineseToEnglishRepaired(message)} I want the meaning to sound polite, not distant.`;
      if (repair === "soften") return makeTranslationSofter(message);
      if (repair === "rewrite") return translateChineseToEnglishRepaired(message);
      if (repair === "boundary") return "Could we talk about this later? I want to give a proper response rather than reply too quickly.";
    }

    if (repair === "clarify") return `${message} What I mean is that I want to be clear and respectful, not distant.`;
    if (repair === "context") return `${message} I am saying this because I want to avoid misunderstanding the situation.`;
    if (repair === "soften") return createEnglishRepairForTranslation(message);
    if (repair === "rewrite") return createEnglishRepairForTranslation(message);
    if (repair === "boundary") return "Could we continue this later? I want to respond properly and avoid misunderstanding.";
  }

  if (scenario === "cantonese") {
    if (repair === "clarify") return convertToCantoneseRepaired(message);
    if (repair === "context") return `${convertToCantoneseRepaired(message)} 我想講清楚啲，唔想你誤會。`;
    if (repair === "soften") return convertToCantoneseRepaired(message);
    if (repair === "rewrite") return convertToCantoneseRepaired(message);
    if (repair === "boundary") return "我想遲啲再覆你，可以嗎？我想認真啲講，唔想求其覆。";
  }

  if (lower.includes("fine")) {
    if (repair === "clarify") return "I'm okay, but I may sound quieter than usual. I don't mean to seem distant.";
    if (repair === "context") return "I'm okay. I have just been tired today, so my reply may sound shorter than I intended.";
    if (repair === "soften") return "I'm okay, thank you for checking in. I just need a little time.";
    if (repair === "rewrite") return "I'm alright, just a bit tired. I appreciate you asking.";
    if (repair === "boundary") return "I'm okay, but can I talk about it later when I have more energy?";
  }

  if (lower.includes("no worries")) {
    if (repair === "clarify") return "No worries, I really mean that. I understand the situation.";
    if (repair === "context") return "No worries, I understand why that happened. Thanks for explaining.";
    if (repair === "soften") return "No worries at all. Thank you for letting me know.";
    if (repair === "rewrite") return "That's okay with me. I appreciate you telling me.";
    if (repair === "boundary") return "That's okay, but could we confirm the next step so there is no confusion?";
  }

  if (lower.includes("talk later")) {
    if (repair === "clarify") return "Can we talk later? I want to reply properly, not avoid the conversation.";
    if (repair === "context") return "Can we talk later? I'm a bit tired right now, but I do want to discuss it.";
    if (repair === "soften") return "Could we talk a little later? I want to give this a proper response.";
    if (repair === "rewrite") return "I want to talk about this, but later would be better for me.";
    if (repair === "boundary") return "I need a bit of time first. Can we talk later today?";
  }

  if (lower.includes("change this part")) {
    if (repair === "clarify") return "I think this part could be improved. I mean this as a suggestion, not criticism.";
    if (repair === "context") return "I think this part could be changed because it may make the final version clearer.";
    if (repair === "soften") return "Maybe we could adjust this part a little to make it stronger.";
    if (repair === "rewrite") return "Could we review this part and see whether a small change would improve it?";
    if (repair === "boundary") return "I can help with this section, but we should agree on the direction first.";
  }

  if (containsChinese(message)) {
    if (message.includes("没事")) return "I'm okay, just a little tired. I do not mean to sound distant.";
    if (message.includes("没问题")) return "That works for me. Thank you for explaining.";
    if (message.includes("迟点")) return "Can we talk later? I want to reply properly when I have more energy.";
  }

  if (tone === "tired") {
    if (repair === "clarify") return `${message} I may sound quiet because I am tired, not because I do not care.`;
    if (repair === "context") return `${message} Today has been a lot, so my reply may sound shorter than I intended.`;
    if (repair === "soften") return `${message} I still appreciate you checking in.`;
    if (repair === "rewrite") return "I may not have the energy to explain everything now, but I still care about this.";
    if (repair === "boundary") return "Can I reply properly later? I need a little time first.";
  }

  if (tone === "anxious") {
    if (repair === "clarify") return `${message} I am asking because I want to understand, not because I want to create pressure.`;
    if (repair === "context") return `${message} I feel a bit unsure, so I wanted to explain where my question is coming from.`;
    if (repair === "soften") return `${message} I hope this comes across clearly and respectfully.`;
    if (repair === "rewrite") return "Could you help me understand this more clearly? I want to make sure I respond in the right way.";
    if (repair === "boundary") return "Could we take this step by step so I can understand what to do next?";
  }

  if (tone === "honest") {
    if (repair === "clarify") return `${message} I mean this honestly, but not in a critical way.`;
    if (repair === "context") return `${message} I am saying this because I think it may help improve the situation.`;
    if (repair === "soften") return `${message} I hope this sounds like a suggestion rather than criticism.`;
    if (repair === "rewrite") return "I think there may be another way to approach this, and I would like to discuss it constructively.";
    if (repair === "boundary") return "I want to be honest about my concern, but I am open to finding a practical solution.";
  }

  if (repair === "clarify") return `${message} What I mean is that I want to be clear, not distant or disrespectful.`;
  if (repair === "context") return `${message} I am saying this because there is some background that may not be visible in the message.`;
  if (repair === "soften") return `${message} I hope this comes across in a respectful and considerate way.`;
  if (repair === "rewrite") return rewriteGenericMessage(message);
  if (repair === "boundary") return "I want to respond properly, but I need a little more time before continuing this conversation.";

  return message;
}

function makeTranslationSofter(message) {
  if (message.includes("没事")) return "I'm okay, thank you for checking. I just need a little time.";
  if (message.includes("没问题")) return "That's okay with me. Thank you for letting me know.";
  if (message.includes("迟点")) return "Could we talk a bit later? I want to reply properly.";
  return "I want to express this in a softer and clearer way so the meaning is not misunderstood.";
}

function rewriteGenericMessage(message) {
  const scenario = getScenario();

  if (scenario.id === "friend") return "I may sound quiet right now, but I do not mean to push you away.";
  if (scenario.id === "tutor") return "Could you please help me understand how I can improve this more clearly?";
  if (scenario.id === "group") return "Could we check this part together and decide what needs to be improved?";
  if (scenario.id === "internship") return "Thank you for your message. I would be happy to discuss this further.";
  if (scenario.id === "translation") return createEnglishRepairForTranslation(message);
  if (scenario.id === "cantonese") return convertToCantoneseRepaired(message);

  return `${message} I want to express this more clearly so my tone is not misunderstood.`;
}

function createReceipt() {
  const scenario = getScenario();
  const tone = getTone();
  const repair = getRepair();
  const preRisk = calculatePreRepairRisk();
  const postRisk = calculatePostRepairRisk();
  const now = new Date();

  const scoreBreakdown = {
    base: 35,
    scenario: scenario.risk,
    tone: tone.risk,
    intensity: intensityMap[state.intensity].score,
    length: state.message.length <= 12 ? 14 : 0,
    language: state.scenario === "translation" || state.scenario === "cantonese" ? 8 : 0,
    special: getSpecialRiskBonus(),
    repair: repair ? repair.scoreChange : 0,
    before: preRisk,
    after: postRisk
  };

  state.receipt = {
    receiptNumber: generateReceiptNumber(),
    message: state.message,
    repairedMessage: state.repairedMessage || generateRepairedMessage(),
    scenario: scenario.title,
    realTone: tone.meant,
    perceivedTone: generatePerceivedTone(),
    contextLoss: preRisk,
    emotionalCost: generateEmotionalCost(preRisk),
    repairMethod: repair ? repair.title : "No repair selected",
    finalOutcome: repair ? repair.result : "No final outcome generated.",
    platform: scenario.platform,
    timestamp: now.toLocaleString(),
    lostCues: generateLostCues(),
    lostSignal: generateLostSignal(),
    culturalAssumption: generateCulturalAssumption(),
    repairStrategy: generateRepairStrategy(),
    scoreBreakdown
  };
}

function createReceiptLine(label, value) {
  return `
    <div class="receipt-line">
      <span class="receipt-label">${h(label)}</span>
      <span class="receipt-value">${h(value)}</span>
    </div>
  `;
}

 function createContextScoreCard(breakdown) {
  if (!breakdown) return "";

  const baseRisk = clamp(
    breakdown.before - breakdown.scenario - breakdown.tone,
    0,
    100
  );

  const contextRisk = breakdown.scenario;
  const toneRisk = breakdown.tone;
  const repairRisk = breakdown.repair;
  const finalScore = breakdown.after;

  return `
    <div class="context-loss-card">
      <div class="context-loss-main">
        <div>
          <h3>Context Loss Score</h3>
          <p>
            A compact design rule showing how context, tone and repair changed the message.
          </p>
        </div>

        <strong class="context-loss-score">${finalScore}%</strong>
      </div>

      <div class="context-loss-pills">
        <span>${baseRisk} base risk</span>
        <span>${formatScoreNumber(contextRisk)} context</span>
        <span>${formatScoreNumber(toneRisk)} tone</span>
        <span>${formatScoreNumber(repairRisk)} repair</span>
      </div>

      <p class="context-loss-note">
        The score is a design device, not a scientific diagnosis. It makes invisible context loss visible.
      </p>
    </div>
  `;
}

function createFeedbackPanel() {
  return `
    <div class="feedback-panel">
      <h3>Prototype Feedback</h3>

      <p>
        This small feedback section turns the receipt into a testable design artifact.
      </p>

      <div class="feedback-group">
        <strong>Was the communication gap clear?</strong>

        <div class="feedback-options">
          ${createFeedbackChip("clarity", "yes", "Yes")}
          ${createFeedbackChip("clarity", "partly", "Partly")}
          ${createFeedbackChip("clarity", "no", "Not yet")}
        </div>
      </div>

      <div class="feedback-group">
        <strong>Which step made the meaning shift most visible?</strong>

        <div class="feedback-options">
          ${createFeedbackChip("meaningfulStep", "context", "Context")}
          ${createFeedbackChip("meaningfulStep", "misread", "Misread")}
          ${createFeedbackChip("meaningfulStep", "compare", "Compare")}
          ${createFeedbackChip("meaningfulStep", "repair", "Repair")}
        </div>
      </div>
    </div>
  `;
}

function createFeedbackChip(type, value, label) {
  const action = type === "clarity" ? "feedback-clarity" : "feedback-step";
  const selected = state.feedback[type] === value ? "selected" : "";

  return `
    <button
      class="feedback-chip ${selected}"
      data-action="${action}"
      data-value="${h(value)}">
      ${h(label)}
    </button>
  `;
}

function setFeedback(type, value) {
  state.feedback[type] = value;
  saveState();

  const action = type === "clarity" ? "feedback-clarity" : "feedback-step";

  document.querySelectorAll(`[data-action="${action}"]`).forEach((button) => {
    button.classList.toggle("selected", button.dataset.value === value);
  });
}

function downloadReceipt() {
  if (!state.receipt.message) createReceipt();

  const trace = getLanguageTrace();

  const lines = [
    "THE MISCOMMUNICATION MACHINE",
    "MISCOMMUNICATION RECEIPT",
    "--------------------------------",
    `Receipt No: ${state.receipt.receiptNumber}`,
    `Timestamp: ${state.receipt.timestamp}`,
    `Platform: ${state.receipt.platform}`,
    "",
    `Original Message: ${state.receipt.message}`
  ];

  if (trace) {
    lines.push("");
    lines.push(`Original Language: ${trace.original}`);
    lines.push(`Literal Translation: ${trace.literal}`);
    lines.push(`Cultural Repair: ${trace.repaired}`);
    lines.push(`Language Note: ${trace.note}`);
  }

  lines.push("");
  lines.push(`Repaired Message: ${state.receipt.repairedMessage}`);
  lines.push(`Context: ${state.receipt.scenario}`);
  lines.push(`Real Intention: ${state.receipt.realTone}`);
  lines.push(`Perceived Tone: ${state.receipt.perceivedTone}`);
  lines.push(`Context Loss: ${state.receipt.contextLoss}%`);
  lines.push(`Emotional Cost: ${state.receipt.emotionalCost}`);
  lines.push(`Lost Signal: ${state.receipt.lostSignal}`);
  lines.push(`Cultural Assumption: ${state.receipt.culturalAssumption}`);
  lines.push(`Repair Method: ${state.receipt.repairMethod}`);
  lines.push(`Repair Strategy: ${state.receipt.repairStrategy}`);
  lines.push(`Final Result: ${state.receipt.finalOutcome}`);
  lines.push("");
  lines.push("Risk Score Breakdown");
  lines.push(`Before Repair: ${state.receipt.scoreBreakdown.before}%`);
  lines.push(`After Repair: ${state.receipt.scoreBreakdown.after}%`);
  lines.push("");
  lines.push("Meaning may vary depending on reader.");

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `miscommunication-receipt-${state.receipt.receiptNumber}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function getSpecialRiskBonus() {
  let bonus = 0;

  if (state.scenario === "friend" && state.tone === "tired") bonus += 10;
  if (state.scenario === "tutor" && state.tone === "honest") bonus += 8;
  if (state.scenario === "group" && state.tone === "honest") bonus += 7;
  if (state.scenario === "internship" && state.tone === "anxious") bonus += 6;

  return bonus;
}

function generateEmotionalCost(score) {
  if (score >= 80) return "High: the reader may strongly misread the relationship or intention.";
  if (score >= 55) return "Medium: the message may create doubt, pressure or emotional distance.";
  return "Low: the message still loses cues, but the risk is limited.";
}

function generateLostCues() {
  const cues = ["voice", "facial expression", "timing"];

  if (state.scenario === "translation") cues.push("cultural context");
  if (state.scenario === "cantonese") cues.push("local rhythm");
  if (state.scenario === "friend") cues.push("relationship reassurance");
  if (state.scenario === "tutor") cues.push("academic intention");
  if (state.scenario === "group") cues.push("team pressure");
  if (state.scenario === "internship") cues.push("professional confidence");

  return cues.join(", ");
}

function generateLostSignal() {
  const scenario = getScenario();
  const tone = getTone();

  if (scenario.id === "cantonese") {
    return "Local rhythm, sentence-final softness and relationship warmth are reduced when the message is treated as direct written Chinese.";
  }

  if (scenario.id === "translation") {
    return "Literal meaning survives, but politeness level, indirectness and emotional warmth may shift in English.";
  }

  if (scenario.id === "friend") {
    return `The message loses reassurance, so ${tone.title.toLowerCase()} intention may be read as distance.`;
  }

  if (scenario.id === "tutor") {
    return "The message loses academic intention, so a request for clarity may sound defensive.";
  }

  if (scenario.id === "group") {
    return "The message loses shared deadline pressure, so coordination may sound like blame.";
  }

  if (scenario.id === "internship") {
    return "The message loses confidence cues, so politeness may sound uncertain or overly cautious.";
  }

  return "The message loses voice, pacing and relationship context.";
}

function generateCulturalAssumption() {
  const scenario = getScenario();

  if (scenario.id === "cantonese") {
    return "A Hong Kong reader may expect conversational rhythm, particles or warmer local phrasing before reading the message as natural.";
  }

  if (scenario.id === "translation") {
    return "The reader may assume that a literal translation carries the same social softness as the original language.";
  }

  if (scenario.id === "friend") {
    return "A close friend may assume that a short reply means emotional distance, even when the sender is only tired.";
  }

  if (scenario.id === "tutor") {
    return "A tutor may assume that a vague or very careful question is challenging feedback rather than asking for guidance.";
  }

  if (scenario.id === "group") {
    return "Group members may assume direct wording is personal criticism when deadline pressure is not visible.";
  }

  if (scenario.id === "internship") {
    return "A recruiter may assume hesitation means low confidence or weak interest.";
  }

  return "The reader fills missing context with their own expectation of politeness, distance and urgency.";
}

function generateRepairStrategy() {
  const repair = getRepair();
  const strategies = {
    clarify: "Make the hidden intention explicit so the reader does not need to guess the emotional direction.",
    context: "Add the missing situation behind the sentence so the reader can judge it in the right frame.",
    soften: "Keep the main meaning, but add warmth and relational reassurance.",
    rewrite: "Rebuild the sentence in a more natural voice for the selected relationship and platform.",
    boundary: "State the limit clearly while protecting the relationship or shared task.",
    silent: "Leave the gap unresolved to show how silence can also become a communication signal."
  };

  return strategies[repair.id] || "Repair the message by making context, tone and intention easier to read.";
}

function getScenario() {
  return scenarios.find((scenario) => scenario.id === state.scenario) || scenarios[0];
}

function getTone() {
  return tones.find((tone) => tone.id === state.tone) || tones[0];
}

function getRepair() {
  return getRepairOptions().find((repair) => repair.id === state.repair) || baseRepairOptions[0];
}

function getIntensityIndex() {
  return {
    low: 0,
    medium: 1,
    high: 2
  }[state.intensity] ?? 1;
}

function formatScoreNumber(number) {
  if (number > 0) return `+${number}`;
  return String(number);
}

function generateReceiptNumber() {
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `MMC-${random}`;
}

function containsChinese(text) {
  return /[\u3400-\u9FFF]/.test(text);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function h(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showWarning(id, message) {
  const element = document.getElementById(id);
  if (!element) return;

  element.innerHTML = `
    <div class="warning-message">
      ${h(message)}
    </div>
  `;
}

function clearWarning(id) {
  const element = document.getElementById(id);
  if (element) element.innerHTML = "";
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("State could not be saved:", error);
  }
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    const parsed = JSON.parse(saved);
    Object.assign(state, getDefaultState(), parsed);

    if (!state.feedback) {
      state.feedback = { clarity: "", meaningfulStep: "" };
    }
  } catch (error) {
    console.warn("State could not be loaded:", error);
  }
}

function openAbout() {
  openModal(aboutModal, aboutCard);
}

function closeAbout() {
  closeModal(aboutModal);
}

function openCaseStudy() {
  openModal(caseStudyModal, caseStudyCard);
}

function closeCaseStudy() {
  closeModal(caseStudyModal);
}

function openModal(modal, card) {
  if (!modal) return;

  lastFocusedElement = document.activeElement;
  activeModal = modal;

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  const focusTarget = card ? card.querySelector("button, [href], input, textarea, [tabindex]:not([tabindex='-1'])") : null;
  if (focusTarget) focusTarget.focus();
}

function closeModal(modal) {
  if (!modal) return;

  modal.classList.add("hidden");
  document.body.style.overflow = "";

  if (activeModal === modal) activeModal = null;

  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

function closeActiveModal() {
  if (!activeModal) return;

  if (activeModal === aboutModal) closeAbout();
  if (activeModal === caseStudyModal) closeCaseStudy();
}

function trapFocus(event) {
  if (!activeModal) return;

  const focusable = activeModal.querySelectorAll(
    "button, [href], input, textarea, select, [tabindex]:not([tabindex='-1'])"
  );

  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

loadState();
render();

/* HOMEPAGE ONLY: keeps the current homepage interaction unchanged. The 8-step experience above is from the uploaded script. */
function copyEmail(target) {
  const email = "hello@miscommunication.dev";

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(email).catch(() => {});
  }

  const span = target.querySelector("span");
  target.classList.add("copied");

  if (span) {
    span.innerHTML = `Copied: <u>${email}</u>`;
  }

  setTimeout(() => {
    target.classList.remove("copied");

    if (span) {
      span.innerHTML = `Reach us: <u>${email}</u>`;
    }
  }, 1200);
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;

  if (target.dataset.action === "copy-email") {
    copyEmail(target);
  }

  if (target.closest("#mobileOverlay")) {
    closeMobileMenu();
  }
});

function initCursorAura() {
  const aura = document.getElementById("cursorAura");
  if (!aura) return;

  let currentX = window.innerWidth / 2;
  let currentY = window.innerHeight / 2;
  let targetX = currentX;
  let targetY = currentY;

  window.addEventListener("mousemove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    aura.classList.add("is-visible");
  });

  window.addEventListener("mouseleave", () => {
    aura.classList.remove("is-visible");
  });

  function animateAura() {
    currentX += (targetX - currentX) * 0.12;
    currentY += (targetY - currentY) * 0.12;
    aura.style.transform = `translate3d(${currentX - 180}px, ${currentY - 180}px, 0)`;
    requestAnimationFrame(animateAura);
  }

  animateAura();
}

function initVideoScrub() {
  const video = document.getElementById("heroVideo");
  if (!video) return;

  const SENSITIVITY = 0.8;
  let prevX = null;
  let targetTime = 0;
  let seeking = false;
  let ready = false;

  video.addEventListener("loadedmetadata", () => {
    ready = true;
    targetTime = 0;

    try {
      video.currentTime = 0;
    } catch (error) {
      console.warn("Video seek is not ready yet.");
    }
  });

  function seekToTarget() {
    if (!ready || !video.duration || seeking) return;

    seeking = true;
    video.currentTime = clamp(targetTime, 0, video.duration);
  }

  video.addEventListener("seeked", () => {
    seeking = false;

    if (Math.abs(video.currentTime - targetTime) > 0.03) {
      seekToTarget();
    }
  });

  window.addEventListener("mousemove", (event) => {
    if (!ready || !video.duration) return;

    if (prevX === null) {
      prevX = event.clientX;
      return;
    }

    const delta = event.clientX - prevX;
    prevX = event.clientX;

    const offset = (delta / window.innerWidth) * SENSITIVITY * video.duration;
    targetTime = clamp(targetTime + offset, 0, video.duration);

    seekToTarget();
  });
}

function initAvatarMouseMove() {
  const avatarStage = document.getElementById("ariaAvatarStage");
  if (!avatarStage) return;

  const cursor = avatarStage.querySelector(".cursor-float");

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  function animateAvatar() {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;

    const avatarX = currentX * 52;
    const avatarY = currentY * 16;
    const rotateY = currentX * 14;
    const rotateX = currentY * -5;

    avatarStage.style.setProperty("--avatar-x", `${avatarX}px`);
    avatarStage.style.setProperty("--avatar-y", `${avatarY}px`);
    avatarStage.style.setProperty("--avatar-ry", `${rotateY}deg`);
    avatarStage.style.setProperty("--avatar-rx", `${rotateX}deg`);

    if (cursor) {
      cursor.style.setProperty("--cursor-x", `${currentX * 70}px`);
      cursor.style.setProperty("--cursor-y", `${currentY * 38}px`);
      cursor.style.setProperty("--cursor-rotate", `${currentX * 9}deg`);
    }

    requestAnimationFrame(animateAvatar);
  }

  window.addEventListener("mousemove", (event) => {
    const x = event.clientX / window.innerWidth;
    const y = event.clientY / window.innerHeight;

    targetX = (x - 0.5) * 2;
    targetY = (y - 0.5) * 2;
  });

  window.addEventListener("mouseleave", () => {
    targetX = 0;
    targetY = 0;
  });

  animateAvatar();
}

function initTypewriter() {
  const target = document.getElementById("typewriterText");
  const cursor = document.getElementById("typeCursor");
  if (!target) return;

  const text = "Glad you stopped in. Type a message, choose a context, and watch how tone, culture and intention shift in transmission.";
  const speed = 38;
  const startDelay = 600;

  target.textContent = "";
  let index = 0;

  setTimeout(() => {
    const timer = setInterval(() => {
      target.textContent = text.slice(0, index + 1);
      index += 1;

      if (index >= text.length) {
        clearInterval(timer);
        if (cursor) cursor.style.display = "none";
      }
    }, speed);
  }, startDelay);
}

function initHeroPills() {
  const pills = document.getElementById("heroPillActions");
  if (!pills) return;

  setTimeout(() => {
    pills.classList.remove("is-hidden");
  }, 400);
}

function initMobileMenu() {
  const button = document.getElementById("mobileMenuBtn");
  const overlay = document.getElementById("mobileOverlay");
  if (!button || !overlay) return;

  button.addEventListener("click", () => {
    const isOpen = button.classList.toggle("open");

    button.setAttribute("aria-expanded", String(isOpen));
    overlay.classList.toggle("open", isOpen);
    overlay.setAttribute("aria-hidden", String(!isOpen));
  });
}

function closeMobileMenu() {
  const button = document.getElementById("mobileMenuBtn");
  const overlay = document.getElementById("mobileOverlay");
  if (!button || !overlay) return;

  button.classList.remove("open");
  button.setAttribute("aria-expanded", "false");
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden", "true");
}

initCursorAura();
initVideoScrub();
initAvatarMouseMove();
initTypewriter();
initHeroPills();
initMobileMenu();

/* =========================================================
   PORTFOLIO FINAL INTERACTION PATCH
   This keeps the original 8-step logic, then adds advanced
   micro-interactions for a stronger portfolio prototype feel.
   ========================================================= */

(function initPortfolioFinalPatch() {
  const interactiveSelector = [
    ".btn",
    ".mini-btn",
    ".chip",
    ".feedback-chip",
    ".hero-pill",
    ".option-card",
    ".step",
    ".avatar-enter-button"
  ].join(",");

  function createRipple(event) {
    const target = event.target.closest(interactiveSelector);
    if (!target || target.disabled || target.getAttribute("aria-disabled") === "true") return;

    const rect = target.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "interaction-ripple";
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;

    target.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), 620);
  }

  document.addEventListener("click", createRipple, true);

  function enhancePortfolioFrame() {
    document.body.dataset.currentStep = String(state.step);

    const screen = document.querySelector(".screen");
    if (screen) screen.dataset.screenStep = String(state.step);

    const receipt = document.querySelector(".receipt");
    if (receipt) {
      window.requestAnimationFrame(() => {
        receipt.classList.add("receipt-ready");
        window.setTimeout(() => receipt.classList.remove("receipt-ready"), 1200);
      });
    }
  }

  const originalRender = render;
  render = function portfolioRender() {
    originalRender();
    enhancePortfolioFrame();
  };

  const originalSetStep = setStep;
  setStep = function portfolioSetStep(step) {
    if (step < 1 || step > 8) return;

    const screen = document.querySelector(".screen");

    if (!content || step === state.step) {
      originalSetStep(step);
      enhancePortfolioFrame();
      return;
    }

    content.classList.add("content-exit");
    if (screen) screen.classList.add("is-switching");

    window.setTimeout(() => {
      originalSetStep(step);
      content.classList.remove("content-exit");

      if (screen) {
        window.setTimeout(() => screen.classList.remove("is-switching"), 260);
      }
    }, 150);
  };

  function showPortfolioToast(message) {
    let toast = document.querySelector(".portfolio-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.className = "portfolio-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("visible");

    window.clearTimeout(showPortfolioToast.hideTimer);
    showPortfolioToast.hideTimer = window.setTimeout(() => {
      toast.classList.remove("visible");
    }, 1800);
  }

  const originalDownloadReceipt = downloadReceipt;
  downloadReceipt = function portfolioDownloadReceipt() {
    const receipt = document.querySelector(".receipt");

    if (receipt) {
      receipt.classList.add("is-printing");
      window.setTimeout(() => receipt.classList.remove("is-printing"), 1250);
    }

    showPortfolioToast("Receipt generated and downloaded.");
    window.setTimeout(() => originalDownloadReceipt(), 260);
  };

  function enhanceKeyboardFeedback() {
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      const target = event.target.closest(interactiveSelector);
      if (!target || target.disabled || target.getAttribute("aria-disabled") === "true") return;

      target.classList.add("keyboard-pressing");
      window.setTimeout(() => target.classList.remove("keyboard-pressing"), 160);
    });
  }

  enhanceKeyboardFeedback();
  enhancePortfolioFrame();
})();


/* =========================================================
   HOMEPAGE FX FINAL PATCH
   Interactive soft-tech homepage effects only.
   ========================================================= */
(function initHomepageFxFinal() {
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const body = document.body;
  const hero = document.querySelector(".hero");

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  function updateMouse(event) {
    targetX = event.clientX - window.innerWidth / 2;
    targetY = event.clientY - window.innerHeight / 2;
    body.classList.add("has-pointer");
  }

  function animateMouseVars() {
    currentX += (targetX - currentX) * 0.075;
    currentY += (targetY - currentY) * 0.075;

    root.style.setProperty("--mx", `${currentX}px`);
    root.style.setProperty("--my", `${currentY}px`);
    root.style.setProperty("--mouse-soft-x", `${currentX * 0.04}px`);
    root.style.setProperty("--mouse-soft-y", `${currentY * 0.04}px`);

    if (!reduceMotion) requestAnimationFrame(animateMouseVars);
  }

  if (hero && !reduceMotion) {
    window.addEventListener("mousemove", updateMouse, { passive: true });
    window.addEventListener("mouseleave", () => {
      targetX = 0;
      targetY = 0;
    });
    animateMouseVars();
  }

  document.addEventListener("click", (event) => {
    const enterTarget = event.target.closest('[data-action="enter-experience"]');
    if (!enterTarget) return;

    body.classList.add("machine-booting");
    window.setTimeout(() => body.classList.remove("machine-booting"), 980);
  }, true);

  const diagnostic = document.getElementById("heroDiagnosticPanel");
  if (diagnostic && !reduceMotion) {
    const score = diagnostic.querySelector("strong");
    const labels = ["73%", "81%", "64%", "88%", "76%"];
    let index = 0;

    window.setInterval(() => {
      index = (index + 1) % labels.length;
      if (score) score.textContent = labels[index];
    }, 1800);
  }

  initSignalCanvas();

  function initSignalCanvas() {
    const canvas = document.getElementById("signalCanvas");
    if (!canvas || reduceMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let points = [];
    let frame = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.max(24, Math.min(58, Math.floor(width / 32)));
      points = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: 1 + Math.random() * 1.8,
        phase: Math.random() * Math.PI * 2,
        anchor: i % 7 === 0
      }));
    }

    function draw() {
      frame += 0.012;
      ctx.clearRect(0, 0, width, height);

      if (!document.body.classList.contains("landing-mode")) {
        requestAnimationFrame(draw);
        return;
      }

      for (const p of points) {
        p.x += p.vx + Math.sin(frame + p.phase) * 0.045;
        p.y += p.vy + Math.cos(frame + p.phase) * 0.045;

        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;
      }

      for (let i = 0; i < points.length; i += 1) {
        for (let j = i + 1; j < points.length; j += 1) {
          const a = points[i];
          const b = points[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 135) {
            const alpha = (1 - dist / 135) * 0.18;
            ctx.strokeStyle = `rgba(241,174,159,${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const p of points) {
        const glow = p.anchor ? 0.85 : 0.48;
        ctx.beginPath();
        ctx.fillStyle = `rgba(246,242,235,${glow})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        if (p.anchor) {
          ctx.beginPath();
          ctx.strokeStyle = "rgba(241,174,159,0.18)";
          ctx.arc(p.x, p.y, 8 + Math.sin(frame * 3 + p.phase) * 2, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize, { passive: true });
    draw();
  }
})();


/* =========================================================
   ADMISSIONS TECH INTERACTION PATCH
   Adds premium micro-interactions without changing the 8-step logic.
   ========================================================= */
(function initAdmissionsTechPatch() {
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const terminalLines = [
    "Scanning emotional context…",
    "Mapping hidden intention…",
    "Comparing cultural signal…",
    "Generating repair path…",
    "Receipt artifact ready."
  ];

  const scanResults = [
    "Hidden tone detected",
    "Context loss predicted",
    "Reader assumption rising",
    "Repair route available"
  ];

  const runtimeStates = [
    "STATE RENDER",
    "CONTEXT SCAN",
    "TONE MODEL",
    "REPAIR OUTPUT",
    "RECEIPT READY"
  ];

  function rotateHeroDiagnostics() {
    const terminal = document.getElementById("techTerminalLine");
    const meter = document.getElementById("heroLatencyValue");
    const scanResult = document.querySelector(".scan-result-row strong");
    const runtimePing = document.getElementById("runtimePing");

    let index = 0;

    function update() {
      index = (index + 1) % terminalLines.length;

      if (terminal) terminal.textContent = terminalLines[index];
      if (scanResult) scanResult.textContent = scanResults[index % scanResults.length];
      if (runtimePing) runtimePing.textContent = runtimeStates[(state.step + index) % runtimeStates.length];
      if (meter) meter.style.width = `${54 + ((index * 11) % 38)}%`;
    }

    update();
    if (!reduceMotion) window.setInterval(update, 1650);
  }

  function initMagneticControls() {
    if (reduceMotion) return;

    const selector = ".hero-pill, .btn, .mini-btn, .chip, .feedback-chip";

    document.addEventListener("mousemove", (event) => {
      const target = event.target.closest(selector);
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 8;

      target.style.setProperty("--magnet-x", `${x}px`);
      target.style.setProperty("--magnet-y", `${y}px`);
    }, { passive: true });

    document.addEventListener("mouseleave", () => {
      document.querySelectorAll(selector).forEach((target) => {
        target.style.setProperty("--magnet-x", "0px");
        target.style.setProperty("--magnet-y", "0px");
      });
    }, true);

    document.addEventListener("mouseout", (event) => {
      const target = event.target.closest(selector);
      if (!target || target.contains(event.relatedTarget)) return;
      target.style.setProperty("--magnet-x", "0px");
      target.style.setProperty("--magnet-y", "0px");
    }, true);
  }

  function syncRuntimeStatus() {
    const runtimePing = document.getElementById("runtimePing");
    if (!runtimePing) return;

    const labels = {
      1: "FLOW MAP",
      2: "INPUT CAPTURE",
      3: "CONTEXT SCAN",
      4: "INTENTION MODEL",
      5: "MISREAD ENGINE",
      6: "COMPARE VIEW",
      7: "REPAIR OUTPUT",
      8: "RECEIPT READY"
    };

    runtimePing.textContent = labels[state.step] || "STATE RENDER";
  }

  const previousRenderForTechPatch = render;
  render = function admissionsTechRender() {
    previousRenderForTechPatch();
    syncRuntimeStatus();
  };

  rotateHeroDiagnostics();
  initMagneticControls();
  syncRuntimeStatus();
})();
