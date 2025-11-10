const Contact = require('./contact.model');
const { NotFoundError, BadRequestError } = require('../../utils/apiError');
const { PAGINATION } = require('../../config/constants');

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

    return contact.addReply(replyMessage, adminId);
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
