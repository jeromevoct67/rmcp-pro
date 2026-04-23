import nodemailer from 'nodemailer';

const createTransporter = () => {
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail01.1-grid.com',
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: process.env.SMTP_USER || 'bigbayad@bigbayadmin.co.za',
      pass: process.env.SMTP_PASSWORD,
    },
    tls: { rejectUnauthorized: false },
  });
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { clientEmail, clientName, rmcpHtml, coverLetter } = req.body;

    if (!clientEmail || !rmcpHtml || !coverLetter) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const transporter = createTransporter();
    await transporter.verify();

    const safeName = (clientName || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const fromAddr = process.env.SMTP_USER || 'bigbayad@bigbayadmin.co.za';

    await transporter.sendMail({
      from: `"Big Bay Administrators" <${fromAddr}>`,
      to: clientEmail,
      cc: fromAddr,
      subject: `Your RMCP Document — ${clientName}`,
      text: coverLetter,
      html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap;line-height:1.6;">${escapeHtml(coverLetter)}</pre>`,
      attachments: [
        {
          filename: `RMCP_${safeName}_${dateStr}.html`,
          content: rmcpHtml,
          contentType: 'text/html',
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: `Email sent to ${clientEmail}`,
    });
  } catch (error) {
    console.error('send-rmcp error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email',
    });
  }
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}
