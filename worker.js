export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle POST to /api/contact
    if (url.pathname === "/api/contact" && request.method === "POST") {
      return handleContactForm(request, env);
    }

    // Handle POST to /api/chat
    if (url.pathname === "/api/chat" && request.method === "POST") {
      return handleChat(request, env);
    }

    // Handle CORS preflight for /api/chat
    if (url.pathname === "/api/chat" && request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "https://4785digital.com",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Everything else: pass through to static assets
    return env.ASSETS.fetch(request);
  },
};

async function handleContactForm(request, env) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "https://4785digital.com",
  };

  try {
    const formData = await request.formData();
    const name = formData.get("name") || "";
    const email = formData.get("email") || "";
    const message = formData.get("message") || "";
    const turnstileToken = formData.get("cf-turnstile-response") || "";
    const honey = formData.get("_honey") || "";

    // Honeypot check
    if (honey) {
      return new Response(JSON.stringify({ success: false, error: "Spam detected." }), { status: 400, headers });
    }

    // Validate required fields
    if (!name.trim() || !email.trim() || !message.trim()) {
      return new Response(JSON.stringify({ success: false, error: "All fields are required." }), { status: 400, headers });
    }

    // Validate Turnstile token server-side
    const turnstileResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
        remoteip: request.headers.get("CF-Connecting-IP") || "",
      }),
    });

    const turnstileResult = await turnstileResponse.json();

    if (!turnstileResult.success) {
      return new Response(JSON.stringify({ success: false, error: "Verification failed. Please try again." }), { status: 403, headers });
    }

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "4785 Digital Website <noreply@4785digital.com>",
        to: ["info@4785digital.com"],
        subject: `New 4785 Digital website inquiry from ${name}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
          <hr>
          <p style="color:#999;font-size:12px;">Submitted from 4785digital.com on ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })}</p>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const err = await emailResponse.text();
      console.error("Resend error:", err);
      return new Response(JSON.stringify({ success: false, error: "Failed to send message. Please try again." }), { status: 500, headers });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });

  } catch (err) {
    console.error("Worker error:", err);
    return new Response(JSON.stringify({ success: false, error: "Something went wrong. Please try again." }), { status: 500, headers });
  }
}

const SYSTEM_PROMPT = `You are the 4785 Digital website assistant. You help visitors learn about the agency's services and encourage them to get in touch directly for specific answers.

ABOUT THE COMPANY:
4785 Digital is a digital marketing agency in Albany, NY. In business since 2013 with over 20 years of industry experience. They've managed over 50M website visits and $15M+ in ad spend. Contact: info@4785digital.com | 518-727-7966 | Mon-Fri 9-5 ET.

Tagline: "Small agency attention with big agency capabilities."

CLIENT PROOF: Cooley Volkswagen has been a client since 2013. Owner Erik Cooley says: "4785 Digital has been our ad agency since 2013 and have continually gone above and beyond to ensure we meet our goals."

SERVICES:

1. SEARCH ENGINE MARKETING (SEM): Campaigns on Google and Bing. Campaign types: Search, Performance Max, Display, Shopping, Demand Gen. Custom-built campaigns (no templates). Continuous optimization. Process: Audit → Strategy → Launch & Optimize → Report.

2. SEARCH ENGINE OPTIMIZATION (SEO): Keyword strategy, technical SEO, content optimization, ongoing optimization. Builds long-term organic visibility that compounds over time. Process: Site Audit → Strategy → Implementation → Measure & Refine.

3. PAID SOCIAL MEDIA: Platforms include Meta, TikTok, Snapchat, LinkedIn. Image, video, carousel formats. Advanced audience targeting, creative-driven demand generation, full-funnel approach. Process: Audience Research → Creative Planning → Campaign Management → Optimize & Report.

4. CONVERSION RATE OPTIMIZATION (CRO): User behavior analysis, A/B testing, page optimization, continuous refinement. Improves results without increasing spend. Process: Behavior Review → Hypothesis → Test & Validate → Iterate & Scale.

5. ANALYTICS & REPORTING: GA4, Google Tag Manager, Floodlight tags, Meta Pixels, server-side tagging, custom dashboards. Process: Discovery & Audit → Strategy → Build & Deploy → Report & Optimize.

APPROACH: They combine all channels into one connected marketing system rather than managing them as separate efforts. Focus on clarity, accountability, and real business growth.

RULES FOR YOUR RESPONSES:
- Be helpful, concise, and professional. Keep responses to 2-3 sentences when possible.
- Answer questions about services, approach, and general capabilities using the info above.
- For specific questions about pricing, timelines, availability, or anything not covered above, say something like: "For specific details on that, I'd recommend reaching out directly — the team can give you an exact answer."
- Always provide contact info (email: info@4785digital.com, phone: 518-727-7966) when suggesting they reach out.
- If someone seems ready to engage, encourage them to use the contact form on the About page or call/email directly.
- Do not make up information not provided above.
- Do not discuss competitors or make comparisons.
- Keep the tone warm but professional — matching a boutique agency feel.`;

async function handleChat(request, env) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "https://4785digital.com",
  };

  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided." }), { status: 400, headers });
    }

    // Limit conversation history to last 10 messages to control costs
    const recentMessages = messages.slice(-10);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: recentMessages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", err);
      return new Response(JSON.stringify({ error: "Sorry, I'm having trouble right now. Please try again or contact us directly at info@4785digital.com." }), { status: 500, headers });
    }

    const result = await response.json();
    const reply = result.content[0].text;

    return new Response(JSON.stringify({ reply }), { status: 200, headers });

  } catch (err) {
    console.error("Chat error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong. Please contact us at info@4785digital.com or call 518-727-7966." }), { status: 500, headers });
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
