const TrustedContact = require("../models/TrustedContact");

async function getTrustedContacts(userId) {
  return TrustedContact.find({ userId }).sort({ createdAt: -1 });
}

async function createTrustedContact(userId, data) {
  return TrustedContact.create({
    userId,
    name: data.name,
    relationship: data.relationship,
    email: data.email,
    phone: data.phone,
    permissions: data.permissions || ["view"],
  });
}

async function updateTrustedContact(userId, contactId, data) {
  return TrustedContact.findOneAndUpdate({ _id: contactId, userId }, data, {
    new: true,
  });
}

async function deleteTrustedContact(userId, contactId) {
  return TrustedContact.findOneAndDelete({ _id: contactId, userId });
}

module.exports = {
  getTrustedContacts,
  createTrustedContact,
  updateTrustedContact,
  deleteTrustedContact,
};
