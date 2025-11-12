const Contact = require('./contact.model');
const { NotFoundError, BadRequestError } = require('../../utils/apiError');
const { PAGINATION } = require('../../config/constants');
const emailService = require('../../services/email.service');

class ContactService {
  async createContact(data, userId = null) {
    const contactData = {
      ...data,
      userId,
    };

    const contact = await Contact.create(contactData);
    return contact;
  }

  async getAllContacts(filters = {}, pagination = {}) {
    const { status, priority, category, search } = filters;
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
    } = pagination;

    const query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    const totalContacts = await Contact.countDocuments(query);
    const totalPages = Math.ceil(totalContacts / limit);
    const skip = (page - 1) * limit;

    const contacts = await Contact.find(query)
      .populate('userId', 'email profile')
      .populate('readBy', 'email profile')
      .populate('reply.repliedBy', 'email profile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return {
      contacts,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalContacts,
        limit: Number(limit),
      },
    };
  }

  async getContactById(contactId) {
    const contact = await Contact.findById(contactId)
      .populate('userId', 'email profile')
      .populate('readBy', 'email profile')
      .populate('reply.repliedBy', 'email profile')
      .populate('assignedTo', 'email profile');

    if (!contact) {
      throw new NotFoundError('Contact not found');
    }

    return contact;
  }

  async markAsRead(contactId, adminId) {
    const contact = await Contact.findById(contactId);

    if (!contact) {
      throw new NotFoundError('Contact not found');
    }

    return contact.markAsRead(adminId);
  }

  async replyToContact(contactId, replyMessage, adminId) {
    const contact = await Contact.findById(contactId);

    if (!contact) {
      throw new NotFoundError('Contact not found');
    }

    if (!replyMessage) {
      throw new BadRequestError('Reply message is required');
    }

    // Add reply to contact
    const updatedContact = await contact.addReply(replyMessage, adminId);

    // Send email to customer
    try {
      await this.sendReplyEmail(contact, replyMessage);
    } catch (error) {
      console.error('Failed to send reply email:', error);
      // Don't throw error, just log it
    }

    return updatedContact;
  }

  async sendReplyEmail(contact, replyMessage) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #E11D48 0%, #BE123C 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .logo-icon { font-size: 48px; margin: 0 0 10px 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .message-box { background: white; border-left: 4px solid #E11D48; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-icon">🏡</div>
            <h1 style="margin: 0;">Homestay Booking</h1>
          </div>
          <div class="content">
            <h2 style="color: #E11D48;">Phản hồi từ Homestay Booking</h2>

            <p>Xin chào <strong>${contact.name}</strong>,</p>

            <p>Cảm ơn bạn đã liên hệ với chúng tôi. Dưới đây là phản hồi cho yêu cầu của bạn:</p>

            <div class="message-box">
              <p><strong>Chủ đề:</strong> ${contact.subject}</p>
              <p><strong>Tin nhắn của bạn:</strong></p>
              <p style="color: #666; font-style: italic;">${contact.message}</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 15px 0;">
              <p><strong>Phản hồi của chúng tôi:</strong></p>
              <p>${replyMessage}</p>
            </div>

            <p>Nếu bạn có thêm câu hỏi, vui lòng liên hệ lại với chúng tôi qua:</p>
            <ul>
              <li>Email: support@homestaybooking.com</li>
              <li>Hotline: +84 123 456 789</li>
            </ul>

            <p style="margin-top: 20px;">Trân trọng,<br><strong>Đội ngũ Homestay Booking</strong></p>
          </div>
          <div class="footer">
            <p>Email này được gửi tự động từ hệ thống Homestay Booking.</p>
            <p>© 2025 Homestay Booking. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Phản hồi từ Homestay Booking

      Xin chào ${contact.name},

      Cảm ơn bạn đã liên hệ với chúng tôi. Dưới đây là phản hồi cho yêu cầu của bạn:

      Chủ đề: ${contact.subject}

      Tin nhắn của bạn:
      ${contact.message}

      Phản hồi của chúng tôi:
      ${replyMessage}

      Nếu bạn có thêm câu hỏi, vui lòng liên hệ lại với chúng tôi qua:
      - Email: support@homestaybooking.com
      - Hotline: +84 123 456 789

      Trân trọng,
      Đội ngũ Homestay Booking
    `;

    return emailService.sendEmail(
      contact.email,
      `[Homestay Booking] Phản hồi: ${contact.subject}`,
      html,
      text
    );
  }

  async updateContactStatus(contactId, status) {
    const contact = await Contact.findById(contactId);

    if (!contact) {
      throw new NotFoundError('Contact not found');
    }

    contact.status = status;
    await contact.save();

    return contact;
  }

  async deleteContact(contactId) {
    const contact = await Contact.findById(contactId);

    if (!contact) {
      throw new NotFoundError('Contact not found');
    }

    await contact.deleteOne();
    return true;
  }
}

module.exports = new ContactService();
