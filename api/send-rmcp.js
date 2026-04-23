// Vercel Serverless Function to generate RMCP PDF and send email
// Uses your hosted email (bigbayadmin.co.za)

import nodemailer from 'nodemailer';
import { convert } from 'html-to-pdf-node';

// Configure email transporter for your hosted email
// Environment variables in Vercel:
// SMTP_HOST = mail01.1-grid.com
// SMTP_PORT = 587 or 465
// SMTP_USER = bigbayad@bigbayadmin.co.za (full email)
// SMTP_PASSWORD = your email password

const createTransporter = () => {
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false, // For self-signed certificates
    },
  });
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { clientEmail, clientName, rmcpHtml, coverLetter } = req.body;

    // Validate inputs
    if (!clientEmail || !rmcpHtml || !coverLetter) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`Generating RMCP PDF for ${clientName} (${clientEmail})`);

    // Convert HTML to PDF
    const pdfBuffer = await htmlToPdf(rmcpHtml, clientName);

    // Send email
    const transporter = createTransporter();
    
    // Test connection
    await transporter.verify();
    console.log('✓ SMTP connection verified');

    const mailOptions = {
      from: process.env.SMTP_USER, // Your hosted email
      to: clientEmail,
      cc: process.env.SMTP_USER, // Send copy to yourself
      subject: `Your RMCP Document - ${clientName}`,
      text: coverLetter,
      html: `<pre style="font-family: Arial, sans-serif; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(coverLetter)}</pre>`,
      attachments: [
        {
          filename: `RMCP_${clientName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✓ Email sent successfully. Message ID: ${info.messageId}`);

    return res.status(200).json({
      success: true,
      message: `Email sent successfully to ${clientEmail}`,
      messageId: info.messageId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in send-rmcp:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

// Convert HTML to PDF using html-to-pdf-node (works serverless)
async function htmlToPdf(htmlContent, clientName) {
  const options = {
    format: 'A4',
    margin: {
      top: '10mm',
      right: '10mm',
      bottom: '10mm',
      left: '10mm',
    },
    displayHeaderFooter: false,
    printBackground: true,
  };

  try {
    const file = {
      content: htmlContent,
    };

    const pdfBuffer = await convert(options, file);
    return pdfBuffer;
  } catch (err) {
    console.error('PDF conversion error:', err);
    throw new Error(`Failed to generate PDF: ${err.message}`);
  }
}

// Escape HTML to prevent XSS in email
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
