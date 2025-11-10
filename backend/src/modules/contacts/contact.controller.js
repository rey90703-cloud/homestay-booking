const contactService = require('./contact.service');
const ApiResponse = require('../../utils/apiResponse');
const catchAsync = require('../../utils/catchAsync');

class ContactController {
  /**
   * Create contact
   * POST /api/v1/contacts
   */
  createContact = catchAsync(async (req, res) => {
    const userId = req.user?._id;
    const contact = await contactService.createContact(req.body, userId);
    ApiResponse.created(res, { contact }, 'Contact submitted successfully');
  });

  /**
   * Get all contacts (Admin only)
   * GET /api/v1/contacts
   */
  getAllContacts = catchAsync(async (req, res) => {
    const { page, limit, status, priority, category, search } = req.query;

    const result = await contactService.getAllContacts(
      { status, priority, category, search },
      { page, limit },
    );

    ApiResponse.success(
      res,
      result.contacts,
      'Contacts retrieved successfully',
      200,
      { pagination: result.pagination },
    );
  });

  /**
   * Get contact by ID
   * GET /api/v1/contacts/:id
   */
  getContactById = catchAsync(async (req, res) => {
    const contact = await contactService.getContactById(req.params.id);
    ApiResponse.success(res, { contact }, 'Contact retrieved successfully');
  });

  /**
   * Mark contact as read
   * PATCH /api/v1/contacts/:id/read
   */
  markAsRead = catchAsync(async (req, res) => {
    const contact = await contactService.markAsRead(req.params.id, req.user._id);
    ApiResponse.success(res, { contact }, 'Contact marked as read');
  });

  /**
   * Reply to contact
   * POST /api/v1/contacts/:id/reply
   */
  replyToContact = catchAsync(async (req, res) => {
    const { message } = req.body;
    const contact = await contactService.replyToContact(req.params.id, message, req.user._id);
    ApiResponse.success(res, { contact }, 'Reply sent successfully');
  });

  /**
   * Update contact status
   * PATCH /api/v1/contacts/:id/status
   */
  updateContactStatus = catchAsync(async (req, res) => {
    const { status } = req.body;
    const contact = await contactService.updateContactStatus(req.params.id, status);
    ApiResponse.success(res, { contact }, 'Contact status updated');
  });

  /**
   * Delete contact
   * DELETE /api/v1/contacts/:id
   */
  deleteContact = catchAsync(async (req, res) => {
    await contactService.deleteContact(req.params.id);
    ApiResponse.success(res, null, 'Contact deleted successfully');
  });
}

module.exports = new ContactController();
