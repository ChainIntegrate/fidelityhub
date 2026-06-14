const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: true, // SSL porta 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function inviaPin(destinatario, nome, pin) {
  await transporter.sendMail({
    from: `"FidelityHub" <${process.env.SMTP_FROM}>`,
    to: destinatario,
    subject: "Il tuo PIN di accesso FidelityHub",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:30px">
        <h2 style="color:#5151FF">Benvenuto su FidelityHub!</h2>
        <p>Ciao <strong>${nome}</strong>,</p>
        <p>Il tuo account è stato creato. Ecco il tuo PIN di accesso:</p>
        <div style="background:#0C0C10;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
          <p style="color:#ffffff60;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Il tuo PIN</p>
          <div style="display:inline-flex;gap:8px">
            ${pin.split("").map(d => `
              <div style="width:44px;height:52px;background:#ffffff15;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:#00C48C;line-height:52px;text-align:center">${d}</div>
            `).join("")}
          </div>
        </div>
        <p>Accedi alla tua area personale su:</p>
        <a href="https://app.chainintegrate.it" style="color:#5151FF">https://app.chainintegrate.it</a>
        <p style="margin-top:24px;color:#8E8E9A;font-size:12px">Non condividere questo PIN con nessuno.</p>
      </div>
    `,
  });
}

module.exports = { inviaPin };