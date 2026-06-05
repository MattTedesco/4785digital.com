(function () {
  // Inject styles
  var style = document.createElement("style");
  style.textContent = `
    .cb-btn {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      width: 56px; height: 56px; border-radius: 50%; border: none; cursor: pointer;
      background: linear-gradient(135deg, #17314a 0%, #1f4067 100%);
      box-shadow: 0 4px 16px rgba(23,49,74,0.35);
      display: flex; align-items: center; justify-content: center;
      transition: transform 200ms ease, box-shadow 200ms ease;
    }
    .cb-btn:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(23,49,74,0.45); }
    .cb-btn svg { width: 26px; height: 26px; fill: #fff; }
    .cb-btn .cb-close { display: none; }
    .cb-btn.open .cb-chat-icon { display: none; }
    .cb-btn.open .cb-close { display: block; }

    .cb-window {
      position: fixed; bottom: 92px; right: 24px; z-index: 9998;
      width: 370px; max-height: 520px;
      background: #fff; border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.15);
      display: none; flex-direction: column;
      overflow: hidden; font-family: "Manrope", sans-serif;
    }
    .cb-window.open { display: flex; }

    .cb-header {
      background: linear-gradient(135deg, #17314a 0%, #1f4067 100%);
      padding: 16px 20px; color: #fff;
    }
    .cb-header h3 { margin: 0 0 2px; font-size: 15px; font-weight: 700; font-family: "Space Grotesk", sans-serif; }
    .cb-header p { margin: 0; font-size: 12px; opacity: 0.75; }

    .cb-messages {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 10px;
      max-height: 340px;
    }

    .cb-msg {
      max-width: 85%; padding: 10px 14px; border-radius: 14px;
      font-size: 13px; line-height: 1.5; word-wrap: break-word;
    }
    .cb-msg.bot {
      background: #f0f3f7; color: #1d2127; align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .cb-msg.user {
      background: linear-gradient(135deg, #17314a 0%, #1f4067 100%);
      color: #fff; align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .cb-msg.bot a { color: #2f5d96; text-decoration: underline; }

    .cb-quick-btns {
      display: flex; flex-wrap: wrap; gap: 6px; padding: 0 16px 12px;
    }
    .cb-quick {
      background: #fff; border: 1px solid #d0d5dd; border-radius: 20px;
      padding: 6px 14px; font-size: 12px; cursor: pointer;
      color: #1d2127; font-family: "Manrope", sans-serif;
      transition: background 150ms, border-color 150ms;
    }
    .cb-quick:hover { background: #f0f3f7; border-color: #2f5d96; }

    .cb-input-row {
      display: flex; gap: 8px; padding: 12px 16px;
      border-top: 1px solid #eee;
    }
    .cb-input {
      flex: 1; border: 1px solid #d0d5dd; border-radius: 20px;
      padding: 8px 16px; font-size: 13px; outline: none;
      font-family: "Manrope", sans-serif;
    }
    .cb-input:focus { border-color: #2f5d96; }
    .cb-send {
      background: linear-gradient(135deg, #17314a 0%, #1f4067 100%);
      color: #fff; border: none; border-radius: 20px;
      padding: 8px 18px; font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: "Manrope", sans-serif;
    }
    .cb-send:disabled { opacity: 0.5; cursor: not-allowed; }

    .cb-typing { display: flex; gap: 4px; padding: 10px 14px; align-self: flex-start; }
    .cb-typing span {
      width: 7px; height: 7px; background: #b0b7c0; border-radius: 50%;
      animation: cbBounce 1.2s infinite;
    }
    .cb-typing span:nth-child(2) { animation-delay: 0.2s; }
    .cb-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes cbBounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }

    @media (max-width: 500px) {
      .cb-window { width: calc(100vw - 32px); right: 16px; bottom: 84px; max-height: 70vh; }
      .cb-btn { bottom: 16px; right: 16px; }
    }
  `;
  document.head.appendChild(style);

  // Build DOM
  var btn = document.createElement("button");
  btn.className = "cb-btn";
  btn.setAttribute("aria-label", "Open chat");
  btn.innerHTML =
    '<svg class="cb-chat-icon" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
    '<svg class="cb-close" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';

  var win = document.createElement("div");
  win.className = "cb-window";
  win.innerHTML =
    '<div class="cb-header"><h3>4785 Digital</h3><p>Ask us anything about our services</p></div>' +
    '<div class="cb-messages" id="cb-msgs"></div>' +
    '<div class="cb-quick-btns" id="cb-quick"></div>' +
    '<div class="cb-input-row">' +
    '<input class="cb-input" id="cb-input" placeholder="Type a question..." autocomplete="off">' +
    '<button class="cb-send" id="cb-send">Send</button></div>';

  document.body.appendChild(win);
  document.body.appendChild(btn);

  var msgs = document.getElementById("cb-msgs");
  var input = document.getElementById("cb-input");
  var sendBtn = document.getElementById("cb-send");
  var quickWrap = document.getElementById("cb-quick");
  var history = [];
  var isOpen = false;
  var greeted = false;

  var quickQs = [
    "What services do you offer?",
    "How does your process work?",
    "How can I get in touch?",
  ];

  function toggleChat() {
    isOpen = !isOpen;
    win.classList.toggle("open", isOpen);
    btn.classList.toggle("open", isOpen);
    if (isOpen && !greeted) {
      greeted = true;
      addMsg("bot", "Hi! I'm the 4785 Digital assistant. I can help with questions about our services, approach, and how we work. What can I help you with?");
      showQuickButtons();
    }
    if (isOpen) input.focus();
  }

  function showQuickButtons() {
    quickWrap.innerHTML = "";
    quickQs.forEach(function (q) {
      var b = document.createElement("button");
      b.className = "cb-quick";
      b.textContent = q;
      b.onclick = function () { sendMessage(q); };
      quickWrap.appendChild(b);
    });
  }

  function addMsg(role, text) {
    var div = document.createElement("div");
    div.className = "cb-msg " + role;
    // Convert URLs to links for bot messages
    if (role === "bot") {
      text = text.replace(
        /(info@4785digital\.com)/g,
        '<a href="mailto:$1">$1</a>'
      );
      text = text.replace(
        /(518-727-7966)/g,
        '<a href="tel:5187277966">$1</a>'
      );
      div.innerHTML = text;
    } else {
      div.textContent = text;
    }
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function addTyping() {
    var div = document.createElement("div");
    div.className = "cb-typing";
    div.id = "cb-typing";
    div.innerHTML = "<span></span><span></span><span></span>";
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function removeTyping() {
    var t = document.getElementById("cb-typing");
    if (t) t.remove();
  }

  function sendMessage(text) {
    if (!text.trim()) return;
    quickWrap.innerHTML = "";
    addMsg("user", text);
    input.value = "";
    sendBtn.disabled = true;

    history.push({ role: "user", content: text });

    addTyping();

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        removeTyping();
        var reply = data.reply || data.error || "Sorry, something went wrong.";
        addMsg("bot", reply);
        history.push({ role: "assistant", content: reply });
      })
      .catch(function () {
        removeTyping();
        addMsg("bot", "Sorry, I'm having trouble connecting. You can reach us directly at info@4785digital.com or 518-727-7966.");
      })
      .finally(function () {
        sendBtn.disabled = false;
        input.focus();
      });
  }

  btn.onclick = toggleChat;
  sendBtn.onclick = function () { sendMessage(input.value); };
  input.onkeydown = function (e) {
    if (e.key === "Enter") sendMessage(input.value);
  };
})();
