// Vercel Serverless Function — Send RMCP via hosted email
// CommonJS syntax (required for Vercel serverless)
// NO Puppeteer — sends HTML as attachment instead

const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { clientEmail, clientName, rmcpHtml, coverLetter } = req.body;

    // Validate inputs
    if (!clientEmail || !rmcpHtml || !coverLetter) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: { clientEmail: !!clientEmail, rmcpHtml: !!rmcpHtml, coverLetter: !!coverLetter }
      });
    }

    console.log(`Sending RMCP to ${clientName} (${clientEmail})`);

    // Create transporter using your hosted email
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail01.1-grid.com',
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verify SMTP connection
    await transporter.verify();
    console.log('SMTP connection verified');

    // Format cover letter as HTML email
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1a5c3a; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 20px;">Big Bay Administrators (Pty) Ltd</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0; font-size: 13px;">RMCP Compliance Services</p>
        </div>
        <div style="background: #fff; border: 1px solid #ddd; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
          <pre style="font-family: Arial, sans-serif; white-space: pre-wrap; line-height: 1.8; color: #333; font-size: 14px;">${escapeHtml(coverLetter)}</pre>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            Big Bay Administrators (Pty) Ltd | Cape Town | jerome@bigbayadmin.co.za<br>
            This document is confidential and intended solely for the named recipient.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Big Bay Administrators" <${process.env.SMTP_USER}>`,
      to: clientEmail,
      cc: process.env.SMTP_USER,
      subject: `Your RMCP Document — ${clientName}`,
      text: coverLetter,
      html: htmlBody,
      attachments: [
        {
          filename: `RMCP_${clientName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.html`,
          content: rmcpHtml,
          contentType: 'text/html',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent. Message ID: ${info.messageId}`);

    return res.status(200).json({
      success: true,
      message: `Email sent to ${clientEmail}`,
      messageId: info.messageId,
    });

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email',
    });
  }
};

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
