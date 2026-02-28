const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const sendMail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: `"BGV Platform" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });
        console.log(`📧 [EMAIL] Sent: To=${to}, Subject="${subject}"`);
        return true;
    } catch (err) {
        console.error('❌ [EMAIL] Error sending email:', err);
        return false;
    }
};

const sendReuploadEmail = async (candidateEmail, candidateName, documentType, comment) => {
    const subject = `Action Required: Re-upload ${documentType}`;
    const html = `
    <h3>Hello ${candidateName},</h3>
    <p>Your <b>${documentType}</b> has been flagged by our verification agent with the following note:</p>
    <blockquote style="background: #f1f5f9; padding: 15px; border-left: 5px solid #ef4444; margin: 20px 0;">
      "${comment}"
    </blockquote>
    <p>Please log in to the candidate portal and re-upload the document to proceed with your verification.</p>
    <p>Best Regards,<br/>BGV Verification Team</p>
  `;
    return sendMail(candidateEmail, subject, html);
};

const sendCredentialsEmail = async (name, email, role, tempPassword) => {
    const subject = `Your ${role} Account Credentials`;
    const html = `
    <h3>Welcome ${name}</h3>
    <p>Your account as a <b>${role}</b> has been created in the BGV system.</p>
    <p>Username: <b>${email}</b></p>
    <p>Temporary Password: <b>${tempPassword}</b></p>
    <p>Please log in and reset your password to activate your account.</p>
  `;
    return sendMail(email, subject, html);
};

const sendInvitationEmail = async (name, email, tempPassword) => {
    const subject = "BGV Initiation - Login Credentials";
    const html = `
    <h3>Welcome ${name}</h3>
    <p>Your background verification process has been initiated.</p>
    <p>Username: <b>${email}</b></p>
    <p>Temporary Password: <b>${tempPassword}</b></p>
    <p>Please log in to start your verification process.</p>
  `;
    return sendMail(email, subject, html);
};

const sendCaseApprovedEmail = async (candidateEmail, candidateName) => {
    const subject = '🎉 Congratulations! Your Background Verification is Complete';
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">✅ Verification Complete!</h1>
      </div>
      <div style="padding: 40px; background: #f8fafc; border-radius: 0 0 16px 16px;">
        <h2 style="color: #0f172a;">Congratulations, ${candidateName}!</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">We are pleased to inform you that your background verification has been <strong style="color: #10b981;">successfully completed and approved</strong>.</p>
        <div style="background: #ecfdf5; border: 2px solid #a7f3d0; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="color: #065f46; font-weight: bold; margin: 0;">🎉 All your documents have been verified and your case has been finalized.</p>
        </div>
        <p style="color: #475569;">No further action is needed from your side. You may log in to the portal to view your final verification report.</p>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 32px;">Best Regards,<br/><strong>BGV Verification Team</strong></p>
      </div>
    </div>
  `;
    return sendMail(candidateEmail, subject, html);
};

const sendCaseRejectedEmail = async (candidateEmail, candidateName) => {
    const subject = 'BGV Update: Your Background Verification Could Not Be Completed';
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Verification Update</h1>
      </div>
      <div style="padding: 40px; background: #f8fafc; border-radius: 0 0 16px 16px;">
        <h2 style="color: #0f172a;">Dear ${candidateName},</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">We regret to inform you that your background verification <strong style="color: #ef4444;">could not be completed successfully</strong>.</p>
        <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="color: #991b1b; font-weight: bold; margin: 0;">Your case has been reviewed and unfortunately does not meet the required verification standards.</p>
        </div>
        <p style="color: #475569;">If you believe this is an error, please contact your HR representative or reach out to our support team for further assistance.</p>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 32px;">Best Regards,<br/><strong>BGV Verification Team</strong></p>
      </div>
    </div>
  `;
    return sendMail(candidateEmail, subject, html);
};

module.exports = {
    sendMail,
    sendReuploadEmail,
    sendCredentialsEmail,
    sendInvitationEmail,
    sendCaseApprovedEmail,
    sendCaseRejectedEmail
};
