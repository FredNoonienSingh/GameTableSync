import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email, subject, message } = await request.json();

    if (!email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // SMTP Transporter konfigurieren
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true, // true für Port 465, false für Port 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // E-Mail senden
    await transporter.sendMail({
      from: `"GameTableSync Kontakt" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_RECEIVER_EMAIL,
      replyTo: email, // Damit du direkt auf die Mail des Nutzers antworten kannst
      subject: `[Web Kontakt] ${subject}`,
      text: `Neue Kontaktanfrage von: ${email}\n\nNachricht:\n${message}`,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}