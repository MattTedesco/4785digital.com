export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Only handle POST to /api/contact
    if (url.pathname === "/api/contact" && request.method === "POST") {
      return handleContactForm(request, env);
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
        from: "4785 Digital Website <onboarding@resend.dev>",
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

    // Redirect back to the page with success param
    return Response.redirect("https://4785digital.com/About.html?submitted=1#contact", 303);

  } catch (err) {
    console.error("Worker error:", err);
    return new Response(JSON.stringify({ success: false, error: "Something went wrong. Please try again." }), { status: 500, headers });
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
