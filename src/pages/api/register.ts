import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

const institutionalEmail = import.meta.env.SMTP_USER;
const copyEmail = 'yamilachahez@gmail.com';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char] ?? char);

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    const form = await request.formData();
    const email = String(form.get('email') ?? '').trim();
    const name = String(form.get('nombre') ?? '').trim();

    if (!email || !name || !institutionalEmail || !import.meta.env.SMTP_PASSWORD) {
      return new Response('Faltan datos de configuración o del formulario.', { status: 400 });
    }

    const fields = [...form.entries()]
      .filter(([key, value]) => !key.startsWith('_') && key !== 'email' && typeof value === 'string' && value.trim())
      .map(([key, value]) => `<tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>${escapeHtml(key.replaceAll('_', ' '))}</strong></td><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(String(value))}</td></tr>`)
      .join('');

    const transporter = nodemailer.createTransport({
      host: import.meta.env.SMTP_HOST ?? 'smtp.hostinger.com',
      port: Number(import.meta.env.SMTP_PORT ?? 465),
      secure: String(import.meta.env.SMTP_SECURE ?? 'true') === 'true',
      auth: { user: institutionalEmail, pass: import.meta.env.SMTP_PASSWORD },
    });

    await transporter.sendMail({
      from: `"Sol Personalizados" <${institutionalEmail}>`,
      to: institutionalEmail,
      cc: copyEmail,
      replyTo: email,
      subject: `Nueva inscripción — ${name}`,
      text: `Nueva inscripción de ${name}. Correo de la persona: ${email}. Revisar el formulario recibido.`,
      html: `<div style="font-family:Arial,sans-serif;color:#64133e"><h1>Nueva inscripción — Sol Personalizados</h1><p>La persona que completa el registro recibirá una copia en <strong>${escapeHtml(email)}</strong>.</p><table style="border-collapse:collapse;width:100%;max-width:760px">${fields}</table></div>`,
    });

    return redirect('/registro-gracias', 303);
  } catch (error) {
    console.error('SMTP registration error:', error);
    return new Response('No se pudo enviar el registro. Intentá nuevamente.', { status: 500 });
  }
};
