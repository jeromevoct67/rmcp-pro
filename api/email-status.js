module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const configured = !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
  return res.status(200).json({ configured, smtpUser: configured ? process.env.SMTP_USER : null });
};
