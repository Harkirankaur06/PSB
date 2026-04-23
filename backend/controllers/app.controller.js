const appService = require("../services/app.service");

async function getOverview(req, res) {
  try {
    const data = await appService.getOverview(req.user, req.session);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getHeaderData(req, res) {
  try {
    const data = await appService.getHeaderData(req.user, req.session);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getContacts(req, res) {
  try {
    const contacts = await appService.getContacts(req.user._id);
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createContact(req, res) {
  try {
    const contact = await appService.createContact(req.user._id, req.body);
    res.status(201).json(contact);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function updateContact(req, res) {
  try {
    const contact = await appService.updateContact(
      req.user._id,
      req.params.id,
      req.body
    );

    if (!contact) {
      return res.status(404).json({ message: "Trusted contact not found" });
    }

    res.json(contact);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function deleteContact(req, res) {
  try {
    const contact = await appService.deleteContact(req.user._id, req.params.id);

    if (!contact) {
      return res.status(404).json({ message: "Trusted contact not found" });
    }

    res.json({ message: "Trusted contact deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getSecurityFeed(req, res) {
  try {
    const data = await appService.getSecurityFeed(req.user, req.session);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getOverview,
  getHeaderData,
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  getSecurityFeed,
};
