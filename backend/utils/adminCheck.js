const getAdminEmails = () => {
  const emailsStr = process.env.ADMIN_EMAILS || '';
  return emailsStr
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
};

const isAdminEmail = (email) => {
  if (!email) return false;
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email.trim().toLowerCase());
};

module.exports = {
  getAdminEmails,
  isAdminEmail
};
